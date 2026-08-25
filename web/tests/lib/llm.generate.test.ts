import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { generate as Generate } from '@/lib/llm';

// `generate`, `generateWithBridge`, and `generateWithFreellmapi` read their
// provider config (LLM_PROVIDER, LLM_BRIDGE_URL, FREELLM_BASE_URL,
// FREELLM_API_KEY) into module-scoped consts at import time. Env vars set
// after the module has loaded have no effect, so every test resets modules
// and re-imports `@/lib/llm` after stubbing env vars to get a fresh module
// evaluation with the desired config.
async function importGenerate(): Promise<typeof Generate> {
  const mod = await import('@/lib/llm');
  return mod.generate;
}

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('generate', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe('bridge provider', () => {
    it('returns the bridge response and never calls freellmapi when the bridge call succeeds', async () => {
      vi.stubEnv('LLM_PROVIDER', 'bridge');
      vi.stubEnv('LLM_BRIDGE_URL', 'http://bridge.test');
      fetchMock.mockResolvedValueOnce(jsonResponse({ response: 'bridge output' }));

      const generate = await importGenerate();
      const result = await generate('system prompt', 'user prompt');

      expect(result).toBe('bridge output');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://bridge.test/chat',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('defaults to the bridge provider when LLM_PROVIDER is unset', async () => {
      vi.stubEnv('LLM_BRIDGE_URL', 'http://bridge.test');
      fetchMock.mockResolvedValueOnce(jsonResponse({ response: 'default bridge output' }));

      const generate = await importGenerate();
      const result = await generate('system prompt', 'user prompt');

      expect(result).toBe('default bridge output');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('falls back to freellmapi and returns its content when the bridge call fails and freellmapi is configured', async () => {
      vi.stubEnv('LLM_PROVIDER', 'bridge');
      vi.stubEnv('LLM_BRIDGE_URL', 'http://bridge.test');
      vi.stubEnv('FREELLM_BASE_URL', 'http://freellm.test/v1');
      vi.stubEnv('FREELLM_API_KEY', 'freellm-key');
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ error: 'bridge down' }, false, 500))
        .mockResolvedValueOnce(
          jsonResponse({ choices: [{ message: { content: 'freellm fallback output' } }] }),
        );

      const generate = await importGenerate();
      const result = await generate('system prompt', 'user prompt');

      expect(result).toBe('freellm fallback output');
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'http://freellm.test/v1/chat/completions',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('rethrows the bridge error when the bridge call fails and freellmapi is not configured', async () => {
      vi.stubEnv('LLM_PROVIDER', 'bridge');
      vi.stubEnv('LLM_BRIDGE_URL', 'http://bridge.test');
      vi.stubEnv('FREELLM_BASE_URL', 'http://freellm.test/v1');
      vi.stubEnv('FREELLM_API_KEY', '');
      fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'bridge exploded' }, false, 500));

      const generate = await importGenerate();

      await expect(generate('system prompt', 'user prompt')).rejects.toThrow('bridge exploded');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('freellmapi provider', () => {
    it('returns the freellmapi content and never calls the bridge when the call succeeds', async () => {
      vi.stubEnv('LLM_PROVIDER', 'freellmapi');
      vi.stubEnv('FREELLM_BASE_URL', 'http://freellm.test/v1');
      vi.stubEnv('FREELLM_API_KEY', 'freellm-key');
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ choices: [{ message: { content: 'direct freellm output' } }] }),
      );

      const generate = await importGenerate();
      const result = await generate('system prompt', 'user prompt');

      expect(result).toBe('direct freellm output');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://freellm.test/v1/chat/completions',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('throws without attempting a fallback when the freellmapi call fails', async () => {
      vi.stubEnv('LLM_PROVIDER', 'freellmapi');
      vi.stubEnv('FREELLM_BASE_URL', 'http://freellm.test/v1');
      vi.stubEnv('FREELLM_API_KEY', 'freellm-key');
      fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'freellm broke' }, false, 500));

      const generate = await importGenerate();

      await expect(generate('system prompt', 'user prompt')).rejects.toThrow('freellm broke');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('sends model "auto" and a Bearer authorization header matching FREELLM_API_KEY', async () => {
      vi.stubEnv('LLM_PROVIDER', 'freellmapi');
      vi.stubEnv('FREELLM_BASE_URL', 'http://freellm.test/v1');
      vi.stubEnv('FREELLM_API_KEY', 'freellm-secret-key');
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ choices: [{ message: { content: 'ok' } }] }),
      );

      const generate = await importGenerate();
      await generate('system prompt', 'user prompt', { maxOutputTokens: 500, temperature: 0.7 });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://freellm.test/v1/chat/completions');

      const headers = init.headers as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer freellm-secret-key');

      const body = JSON.parse(init.body as string) as {
        model: string;
        messages: { role: string; content: string }[];
        max_tokens?: number;
        temperature?: number;
      };
      expect(body.model).toBe('auto');
      expect(body.messages).toEqual([
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'user prompt' },
      ]);
      expect(body.max_tokens).toBe(500);
      expect(body.temperature).toBe(0.7);
    });
  });
});
