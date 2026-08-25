export { extractJSON } from './extract-json';

const LLM_PROVIDER = (process.env.LLM_PROVIDER ?? 'bridge') as 'bridge' | 'freellmapi';

const LLM_BRIDGE_URL = process.env.LLM_BRIDGE_URL ?? 'http://127.0.0.1:3000';
const LLM_BRIDGE_API_KEY = process.env.LLM_BRIDGE_API_KEY;
const LLM_BRIDGE_PROVIDER = (process.env.LLM_BRIDGE_PROVIDER ?? 'claude') as 'claude' | 'chatgpt';

const FREELLM_BASE_URL = process.env.FREELLM_BASE_URL ?? 'https://freellmapi-19vj.onrender.com/v1';
const FREELLM_API_KEY = process.env.FREELLM_API_KEY;

export interface LLMOptions {
  maxOutputTokens?: number;
  temperature?: number;
}

export async function generate(
  systemPrompt: string,
  userPrompt: string,
  opts: LLMOptions = {},
): Promise<string> {
  if (LLM_PROVIDER === 'freellmapi') {
    return generateWithFreellmapi(systemPrompt, userPrompt, opts);
  }

  try {
    return await generateWithBridge(systemPrompt, userPrompt);
  } catch (err) {
    // Bridge failures are diverse (session logged out, no browser slot, DOM
    // drift, actual rate limit) — any of them should fall through to
    // freellmapi if it's configured, rather than only retrying on rate limits.
    if (FREELLM_BASE_URL && FREELLM_API_KEY) {
      return generateWithFreellmapi(systemPrompt, userPrompt, opts);
    }
    throw err;
  }
}

async function generateWithBridge(systemPrompt: string, userPrompt: string): Promise<string> {
  const prompt = systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (LLM_BRIDGE_API_KEY) headers['Authorization'] = `Bearer ${LLM_BRIDGE_API_KEY}`;

  const res = await fetch(`${LLM_BRIDGE_URL}/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt, provider: LLM_BRIDGE_PROVIDER }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `Bridge responded ${res.status}`);
  }

  const data = (await res.json()) as { response: string };
  return data.response;
}

async function generateWithFreellmapi(
  systemPrompt: string,
  userPrompt: string,
  opts: LLMOptions,
): Promise<string> {
  if (!FREELLM_API_KEY) throw new Error('FREELLM_API_KEY is not set');

  const res = await fetch(`${FREELLM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FREELLM_API_KEY}`,
    },
    body: JSON.stringify({
      // NOTE: "auto" lets the proxy pick/prioritize a provider itself.
      // Double-check this is the literal value freellmapi expects once
      // real API docs are available — a placeholder pending confirmation.
      model: 'auto',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: opts.maxOutputTokens,
      temperature: opts.temperature,
    }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `freellmapi responded ${res.status}`);
  }

  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content;
}

export function isRateLimitError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('too many requests') ||
    msg.includes('503') ||
    msg.includes('overloaded') ||
    msg.includes('high demand') ||
    msg.includes('unavailable') ||
    msg.includes('retryafter')
  );
}
