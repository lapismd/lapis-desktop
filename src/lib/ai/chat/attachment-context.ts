import type { AgentContextBlock } from "../core/context.ts";

/** Read explicit vault attachments at dispatch, without rewriting authored text. */
export async function attachmentContext(
  paths: readonly string[],
  read: ((path: string) => Promise<string | undefined>) | undefined,
  signal: AbortSignal,
): Promise<AgentContextBlock[]> {
  if (!paths.length) return [];
  if (!read) throw new Error("File context is unavailable in this chat");
  if (paths.length > 8)
    throw new Error("Attach at most eight files per message");
  const blocks: AgentContextBlock[] = [];
  let bytes = 0;
  for (const path of paths) {
    signal.throwIfAborted();
    if (
      !path ||
      path.startsWith("/") ||
      /[:\\\u0000]/u.test(path) ||
      path.split("/").some((part) => !part || part === "." || part === "..")
    )
      throw new Error("Attached files must use vault-relative paths");
    const text = await read(path);
    signal.throwIfAborted();
    if (text === undefined)
      throw new Error(`Attached file is unavailable: ${path}`);
    const size = new TextEncoder().encode(text).length;
    bytes += size;
    if (size > 65_536 || bytes > 131_072)
      throw new Error(
        "File context exceeds 64 KiB per file or 128 KiB per message",
      );
    blocks.push({
      kind: "file-context",
      id: `file:${path}`,
      content: `File: ${path}\n\n${text}`,
      metadata: { path },
    });
  }
  return blocks;
}
