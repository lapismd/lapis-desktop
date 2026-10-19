// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it, vi } from "vitest";
import type { App } from "@lapis-notes/api";
import type { TranscriptBlock } from "@lapismd/design-core/chat";
import { transcriptNoteReferences } from "../../../src/lib/ai/chat/transcript-note-references.ts";
import { transcriptLinks } from "../../../src/lib/ai/chat/transcript-links.ts";

const block: TranscriptBlock = {
  id: "u1/body",
  revision: "retained-revision",
  kind: "markdown",
  label: "Your message",
  text: "Summarize @[[Notes/Welcome.md]]",
};
function host() {
  const openFile = vi.fn().mockResolvedValue(undefined);
  const notify = vi.fn();
  const getFirstLinkpathDest = vi.fn((path: string) =>
    ["Notes/Welcome.md", "Notes/beta file.md", ".lapis/private.md"].includes(
      path,
    )
      ? { path }
      : null,
  );
  const app = {
    openFile,
    metadataCache: { getFirstLinkpathDest },
    notifications: { notify },
  } as unknown as App;
  return { app, openFile, getFirstLinkpathDest, notify };
}

describe("transcript note links", () => {
  it("retains exact source ranges for current mentions and captured wiki mentions", () => {
    const text = '😀 Summarize @[[Notes/Welcome.md]] and @"Notes/beta file.md"';
    const refs = transcriptNoteReferences(text);
    expect(refs.map((ref) => [text.slice(ref.from, ref.to), ref.path])).toEqual(
      [
        ["@[[Notes/Welcome.md]]", "Notes/Welcome.md"],
        ['@"Notes/beta file.md"', "Notes/beta file.md"],
      ],
    );
    expect(transcriptNoteReferences("See @Notes/Welcome.md")[0]?.path).toBe(
      "Notes/Welcome.md",
    );
  });
  it("uses Mira wiki aliases and keeps code, escapes, tables and Markdown links intact", () => {
    const text =
      "[[Notes/Welcome.md|Welcome]]\n\n`@Notes/Welcome.md`\n\n" +
      "```md\n@[[Notes/Welcome.md]]\n```\n\n" +
      "\\[[Notes/Welcome.md]] and [Welcome](Notes/Welcome.md)\n\n" +
      "| Note |\n| --- |\n| [[Notes/Welcome.md]] |";
    expect(transcriptNoteReferences(text)).toEqual([
      { from: 0, to: 28, path: "Notes/Welcome.md", label: "Welcome" },
    ]);
  });
  it("decorates without changing captured source, identities or revisions", () => {
    const { app } = host();
    const original = structuredClone(block);
    const links = transcriptLinks(app);
    const refs = links.inlineReferences(block);
    expect(refs).toHaveLength(1);
    expect(block.text.slice(refs[0]!.from, refs[0]!.to)).toBe(
      "@[[Notes/Welcome.md]]",
    );
    expect(block).toEqual(original);
    expect(links.inlineReferences({ ...block, kind: "code" })).toEqual([]);
  });
  it("resolves encoded Markdown destinations and uses the Markdown plugin's App opener", () => {
    const { app, openFile, getFirstLinkpathDest } = host();
    transcriptLinks(app, "Notes/transcript.jsonl").resolveFileLink(
      block,
      "Notes/beta%20file.md",
    )?.();
    expect(getFirstLinkpathDest).toHaveBeenCalledWith(
      "Notes/beta file.md",
      "Notes/transcript.jsonl",
    );
    expect(openFile).toHaveBeenCalledWith({ path: "Notes/beta file.md" });
  });
  it("keeps unavailable and non-vault references inert", () => {
    const { app, openFile } = host();
    const links = transcriptLinks(app);
    for (const path of [
      "Missing.md",
      "javascript:alert(1)",
      "file:///tmp/note.md",
      "https://example.com",
      "/etc/passwd",
      "%2Fetc/passwd",
      ".lapis/private.md",
    ])
      expect(links.resolveFileLink(block, path)).toBeUndefined();
    expect(links.inlineReferences({ ...block, text: "@Missing.md" })).toEqual(
      [],
    );
    expect(transcriptLinks().inlineReferences(block)).toEqual([]);
    expect(openFile).not.toHaveBeenCalled();
  });
  it("reports failed navigation once through App notifications", async () => {
    const { app, openFile, notify } = host();
    openFile.mockRejectedValue(new Error("Editor unavailable"));
    transcriptLinks(app).resolveFileLink(block, "Notes/Welcome.md")?.();
    await vi.waitFor(() => expect(notify).toHaveBeenCalledOnce());
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "ai-note-navigation-error",
        severity: "error",
        message: "Editor unavailable",
      }),
    );
  });
});
