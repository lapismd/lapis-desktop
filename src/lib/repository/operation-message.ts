/** jj-store message tokenization: complete native/Git commit and change IDs only. */
export function operationMessageParts(message: string) {
  const identity = /\b(?:[0-9a-fA-F]{128}|[0-9a-fA-F]{40}|[0-9a-fA-F]{32})\b/gu;
  const parts: { type: "text" | "commit" | "change"; value: string }[] = [];
  let last = 0;
  for (const match of message.matchAll(identity)) {
    if (match.index > last)
      parts.push({ type: "text", value: message.slice(last, match.index) });
    parts.push({
      type: match[0].length === 32 ? "change" : "commit",
      value: match[0].toLowerCase(),
    });
    last = match.index + match[0].length;
  }
  if (last < message.length)
    parts.push({ type: "text", value: message.slice(last) });
  return parts.length ? parts : [{ type: "text" as const, value: message }];
}
