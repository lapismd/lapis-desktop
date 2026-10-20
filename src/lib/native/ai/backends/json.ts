// SPDX-License-Identifier: Apache-2.0; copied/adapted from jj-store packages/jj-history/src/parse.ts.
/** Bounded integer-only JSON for the native conversation contract. Strings use the
 * platform JSON decoder; integer tokens never pass through a floating parse. */
export function parseNativeConversationJson(text: string): unknown {
  let at = 0;
  const fail = (): never => {
    throw new SyntaxError("Invalid native conversation JSON");
  };
  const space = () => {
    while (/[ \t\r\n]/.test(text[at] ?? "!")) at++;
  };
  function string(): string {
    const start = at++;
    while (at < text.length) {
      const char = text[at++];
      if (char === '"') return JSON.parse(text.slice(start, at)) as string;
      if (char === "\\") at++;
    }
    return fail();
  }
  function value(depth: number): unknown {
    if (depth > 128) fail();
    space();
    const char = text[at];
    if (char === '"') return string();
    if (char === "{" || char === "[") {
      const object = char === "{";
      const result: Record<string, unknown> | unknown[] = object ? {} : [];
      const end = object ? "}" : "]";
      at++;
      space();
      if (text[at] === end) {
        at++;
        return result;
      }
      while (at < text.length) {
        space();
        let key = "";
        if (object) {
          if (text[at] !== '"') fail();
          key = string();
          space();
          if (Object.hasOwn(result, key) || text[at++] !== ":") fail();
        }
        const item = value(depth + 1);
        if (object)
          Object.defineProperty(result, key, {
            value: item,
            writable: true,
            enumerable: true,
            configurable: true,
          });
        else (result as unknown[]).push(item);
        space();
        if (text[at] === end) {
          at++;
          return result;
        }
        if (text[at++] !== ",") fail();
      }
      return fail();
    }
    for (const [token, result] of [
      ["true", true],
      ["false", false],
      ["null", null],
    ] as const) {
      if (text.startsWith(token, at)) {
        at += token.length;
        return result;
      }
    }
    const start = at;
    while (/[-0-9]/.test(text[at] ?? "!")) at++;
    const token = text.slice(start, at);
    if (token.length > 20 || !/^-?(?:0|[1-9]\d*)$/.test(token)) fail();
    const n = Number(token);
    return Number.isSafeInteger(n) ? n : BigInt(token);
  }
  const parsed = value(0);
  space();
  if (at !== text.length) fail();
  return parsed;
}
