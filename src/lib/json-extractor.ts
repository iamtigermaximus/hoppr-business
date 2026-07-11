/**
 * Safe JSON object extractor — replaces ReDoS-vulnerable regex with a
 * bracket-counting parser. O(n) instead of potentially O(2^n).
 *
 * Scans text character-by-character, tracking nesting depth and string state.
 * Returns up to `maxObjects` balanced top-level `{...}` blocks, each capped
 * at `maxLength` characters.
 */

export interface ExtractOptions {
  /** Maximum number of objects to extract (default 5). */
  maxObjects?: number;
  /** Maximum character length per extracted object (default 50_000). */
  maxLength?: number;
}

export function extractJsonObjects(
  text: string,
  options: ExtractOptions = {},
): string[] {
  const { maxObjects = 5, maxLength = 50_000 } = options;
  const results: string[] = [];
  let i = 0;

  while (i < text.length && results.length < maxObjects) {
    // Find next opening brace
    while (i < text.length && text[i] !== "{") i++;
    if (i >= text.length) break;

    let depth = 0;
    const start = i;
    let inString = false;
    let escaped = false;

    while (i < text.length) {
      const ch = text[i];

      if (escaped) {
        escaped = false;
      } else if (ch === "\\" && inString) {
        escaped = true;
      } else if (ch === '"' && !escaped) {
        inString = !inString;
      } else if (!inString) {
        if (ch === "{") {
          depth++;
        } else if (ch === "}") {
          depth--;
          if (depth === 0) {
            const extracted = text.slice(start, i + 1);
            if (extracted.length <= maxLength) {
              results.push(extracted);
            }
            i++;
            break;
          }
        }
      }
      i++;
    }

    // Safety valve: if we exhausted the string without closing,
    // stop to avoid an infinite loop
    if (depth !== 0) break;
  }

  return results;
}
