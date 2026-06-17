import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

type LLMModel = Parameters<typeof generateText>[0]["model"];

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
].filter(Boolean) as string[];

const GROQ_KEYS = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
  process.env.GROQ_API_KEY_5,
].filter(Boolean) as string[];

let geminiKeyIdx = 0;
let groqKeyIdx = 0;

function nextGeminiModel(): LLMModel | null {
  if (GEMINI_KEYS.length === 0) return null;
  const key = GEMINI_KEYS[geminiKeyIdx % GEMINI_KEYS.length];
  geminiKeyIdx++;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  return createGoogleGenerativeAI({ apiKey: key })(model) as LLMModel;
}

function nextGroqModel(): LLMModel | null {
  if (GROQ_KEYS.length === 0) return null;
  const key = GROQ_KEYS[groqKeyIdx % GROQ_KEYS.length];
  groqKeyIdx++;
  const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
  return createGroq({ apiKey: key })(model) as LLMModel;
}

// Covers both hard rate limits (429/quota) and transient provider overload
// (503/"high demand") — free-tier Gemini returns the latter under load, and
// without this the key-rotation loop below would throw on the first key
// instead of trying the next one.
export function isRateLimitError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("rate limit") ||
    msg.includes("quota") ||
    msg.includes("resource_exhausted") ||
    msg.includes("too many requests") ||
    msg.includes("503") ||
    msg.includes("overloaded") ||
    msg.includes("high demand") ||
    msg.includes("unavailable")
  );
}

export interface LLMOptions {
  maxOutputTokens?: number;
  temperature?: number;
}

export async function generate(
  systemPrompt: string,
  userPrompt: string,
  opts: LLMOptions = {},
): Promise<string> {
  const { maxOutputTokens = 3000, temperature = 0.7 } = opts;

  // maxRetries: 0 — let our key-rotation loop handle retries, not the SDK.
  const params = {
    system: systemPrompt,
    prompt: userPrompt,
    maxOutputTokens,
    temperature,
    maxRetries: 0,
  };

  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const model = nextGeminiModel();
    if (!model) break;
    try {
      const result = await generateText({ model, ...params });
      // finish_reason "length" means the provider silently truncated the response
      // instead of returning a 429. Rotate to the next key.
      if (result.finishReason === "length") continue;
      return result.text;
    } catch (err) {
      if (!isRateLimitError(err)) throw err;
    }
  }

  for (let i = 0; i < GROQ_KEYS.length; i++) {
    const model = nextGroqModel();
    if (!model) break;
    try {
      const result = await generateText({ model, ...params });
      // Same truncation guard as Gemini — Groq's free tier TPM limit shows
      // as finish_reason "length" rather than a 429 error.
      if (result.finishReason === "length") continue;
      return result.text;
    } catch (err) {
      if (!isRateLimitError(err)) throw err;
    }
  }

  const ollamaModelId = process.env.OLLAMA_MODEL ?? "llama3.2";
  const { ollama } = await import("ollama-ai-provider");
  // LanguageModelV1 → V2 mismatch between ollama-ai-provider and ai@6; safe at runtime.
  const ollamaModel = ollama(ollamaModelId) as unknown as LLMModel;
  const { text } = await generateText({ model: ollamaModel, ...params });
  return text;
}

function tryParseJSON<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export function extractJSON<T>(text: string): T {
  const direct = tryParseJSON<T>(text);
  if (direct !== null) return direct;

  // Closed code block: ```json ... ```
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) {
    const fromBlock = tryParseJSON<T>(codeBlock[1].trim());
    if (fromBlock !== null) return fromBlock;
  }

  // Unclosed code block (truncated response): ```json { ... }
  const openBlock = text.match(/```(?:json)?\s*(\{[\s\S]*\})/);
  if (openBlock) {
    const fromOpen = tryParseJSON<T>(openBlock[1].trim());
    if (fromOpen !== null) return fromOpen;
  }

  // Raw JSON object anywhere in the text
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    const fromObj = tryParseJSON<T>(objMatch[0]);
    if (fromObj !== null) return fromObj;
  }

  throw new Error(
    `LLM response was not valid JSON. First 200 chars: ${text.slice(0, 200)}`,
  );
}
