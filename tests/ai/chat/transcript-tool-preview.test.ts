import { expect, it } from "vitest";
import { previewTranscriptTool } from "../../../src/lib/ai/chat/transcript-tool-preview.ts";
import { projectAiTranscript } from "../../../src/lib/ai/chat/transcript-projection.ts";
import type { AiChatToolItem } from "../../../src/lib/ai/chat/chat-tool-display.ts";

function preview(
  output: string,
  path = "Notes/Welcome.md",
  state: AiChatToolItem["state"] = "completed",
  custom = false,
) {
  const item: AiChatToolItem = {
    id: "captured-read",
    toolId: "read-1",
    type: "tool",
    name: "read_file",
    state,
    input: JSON.stringify({ path }),
    output,
  };
  const original = projectAiTranscript([item])[0].tools![0];
  return { original, displayed: previewTranscriptTool(original, item, custom) };
}
it("shows captured markdown and inline source without changing its capture or block identity", () => {
  const text = "# Captured title\n\n- [ ] Review this note\n";
  const { original, displayed } = preview(JSON.stringify({ content: text }));
  expect(displayed.raw).toBe(original.raw);
  expect(displayed.blocks[0]).toMatchObject({
    id: original.blocks[0].id,
    kind: "markdown",
    text,
    path: "Notes/Welcome.md",
  });
  expect(displayed.inlineBlocks![0]).toMatchObject({ kind: "code", text });
});
it.each([
  '{"name":"notes-demo","private":true}',
  "[1,2,3]",
  '"a literal JSON string"',
])("retains a JSON file's exact captured source: %s", (text) => {
  const { displayed } = preview(text, "package.json");
  expect(displayed.blocks[0]).toMatchObject({
    kind: "code",
    text,
    path: "package.json",
  });
});
it("reads a captured MCP text envelope without fetching the current file", () => {
  const { displayed } = preview(
    JSON.stringify({ content: [{ type: "text", text: "# Saved MCP result" }] }),
  );
  expect(displayed.blocks[0].text).toBe("# Saved MCP result");
});
it("retains registered result views and never promotes failed reads into markdown file previews", () => {
  const custom = preview("# Original", "Notes/Welcome.md", "completed", true);
  expect(custom.displayed.blocks).toBe(custom.original.blocks);
  const failed = preview("permission denied", "Notes/Welcome.md", "error");
  expect(failed.displayed.blocks[0].kind).toBe("code");
  expect(failed.displayed.inlineBlocks).toBeUndefined();
});
