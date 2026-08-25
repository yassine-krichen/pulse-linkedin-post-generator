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
