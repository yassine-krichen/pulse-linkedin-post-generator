import { describe, expect, it } from 'vitest';
import { extractJSON, isRateLimitError } from '@/lib/llm';

interface Sample {
  worthy: boolean;
  reason: string;
}

describe('extractJSON', () => {
  it('parses a direct JSON object with no wrapper', () => {
    const result = extractJSON<Sample>('{"worthy":true,"reason":"specific enough"}');
    expect(result).toEqual({ worthy: true, reason: 'specific enough' });
  });

  it('parses JSON inside a closed ```json code block', () => {
    const text = '```json\n{"worthy":true,"reason":"closed block"}\n```';
    expect(extractJSON<Sample>(text)).toEqual({ worthy: true, reason: 'closed block' });
  });

  it('parses JSON inside an unclosed code block (truncated LLM response)', () => {
    const text = '```json\n{"worthy":true,"reason":"truncated but valid"}';
    expect(extractJSON<Sample>(text)).toEqual({ worthy: true, reason: 'truncated but valid' });
  });

  it('parses a raw JSON object embedded in surrounding prose', () => {
    const text = 'Sure, here is the result:\n{"worthy":false,"reason":"too vague"}\nHope that helps!';
    expect(extractJSON<Sample>(text)).toEqual({ worthy: false, reason: 'too vague' });
  });

  it('throws with a snippet of the offending text when nothing parses', () => {
    const text = 'I cannot help with that request.';
    expect(() => extractJSON<Sample>(text)).toThrow(/not valid JSON/);
  });
});

describe('isRateLimitError', () => {
  it('recognizes hard rate-limit errors', () => {
    expect(isRateLimitError(new Error('429 Too Many Requests'))).toBe(true);
    expect(isRateLimitError(new Error('Quota exceeded for this project'))).toBe(true);
    expect(isRateLimitError(new Error('RESOURCE_EXHAUSTED'))).toBe(true);
  });

  it('recognizes transient overload errors (free-tier Gemini under load)', () => {
    expect(isRateLimitError(new Error('This model is currently experiencing high demand.'))).toBe(
      true,
    );
    expect(isRateLimitError(new Error('503 Service Unavailable: the model is overloaded'))).toBe(
      true,
    );
  });

  it('does not treat an unrelated error as rate-limited', () => {
    expect(isRateLimitError(new Error('Invalid API key'))).toBe(false);
  });
});
