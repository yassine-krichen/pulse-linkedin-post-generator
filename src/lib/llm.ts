export { extractJSON } from './extract-json';

const BRIDGE_URL = process.env.BRIDGE_URL ?? 'http://127.0.0.1:3000';
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;
const BRIDGE_PROVIDER = (process.env.BRIDGE_PROVIDER ?? 'claude') as 'claude' | 'chatgpt';

export interface LLMOptions {
  maxOutputTokens?: number;
  temperature?: number;
}

export async function generate(
  systemPrompt: string,
  userPrompt: string,
  _opts: LLMOptions = {},
): Promise<string> {
  const prompt = systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (BRIDGE_API_KEY) headers['Authorization'] = `Bearer ${BRIDGE_API_KEY}`;

  const res = await fetch(`${BRIDGE_URL}/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt, provider: BRIDGE_PROVIDER }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `Bridge responded ${res.status}`);
  }

  const data = (await res.json()) as { response: string };
  return data.response;
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
