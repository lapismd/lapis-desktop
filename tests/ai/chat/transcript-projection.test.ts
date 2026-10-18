import { describe, expect, it } from "vitest";
import { projectAiTranscript } from "../../../src/lib/ai/chat/transcript-projection.ts";
import type { AiChatItem } from "../../../src/lib/ai/chat/chat-items.ts";

describe("AI transcript presentation projection", () => {
  it("keeps captured identities while partial text changes the display revision", () => {
    const source: AiChatItem = {
      id: "answer",
      type: "message",
      role: "assistant",
      text: "A",
    };
    const before = projectAiTranscript([source])[0]!;
    const after = projectAiTranscript([
      { ...source, text: "A complete answer" },
    ])[0]!;
    expect(after.id).toBe(before.id);
    expect(after.blocks[0]?.id).toBe(before.blocks[0]?.id);
    expect(after.blocks[0]?.revision).not.toBe(before.blocks[0]?.revision);
    expect(after.blocks[0]?.text).toBe("A complete answer");
    expect(source.text).toBe("A");
  });
  it("keeps context distinct from the authored user message", () => {
    const source: AiChatItem[] = [
      {
        id: "prompt",
        type: "message",
        role: "user",
        text: "Summarize the note",
      },
      { id: "context", type: "status", text: "Captured note context" },
      {
        id: "reasoning",
        type: "thinking",
        state: "streaming",
        text: "Reviewing headings",
      },
    ];
    const projected = projectAiTranscript(source);
    expect(projected.map((item) => item.kind)).toEqual([
      "message",
      "context",
      "reasoning",
    ]);
    expect(projected[0]?.blocks[0]?.text).toBe("Summarize the note");
    expect(projected[1]?.turn?.id).toBe("prompt");
    expect(projected[2]?.defaultExpanded).toBe(true);
  });
  it("groups tools within a turn and retains raw payload and failure state", () => {
    const call = (id: string): AiChatItem => ({
      id,
      type: "tool",
      toolId: `provider-${id}`,
      name: "vault.read",
      state: "error",
      input: '{"path":"a.md"}',
      output: "Unavailable",
    });
    const projected = projectAiTranscript([
      call("a"),
      call("b"),
      { id: "next", type: "message", role: "user", text: "Next request" },
      call("c"),
    ]);
    expect(projected[0]?.tools?.map((item) => item.id)).toEqual(["a", "b"]);
    expect(projected[2]?.tools?.map((item) => item.id)).toEqual(["c"]);
    expect(projected[0]?.tools?.[0]?.status).toBe("error");
    expect(JSON.parse(projected[0]!.tools![0]!.raw).input).toBe(
      '{"path":"a.md"}',
    );
  });
  it("leaves pending interactions to the retained request drawer", () => {
    const source: AiChatItem[] = [
      {
        id: "question",
        type: "question",
        status: "pending",
        request: { id: "q", title: "Choose", questions: [] },
      },
    ];
    expect(projectAiTranscript(source)).toEqual([]);
    expect(
      projectAiTranscript([
        { ...source[0]!, status: "answered" } as AiChatItem,
      ])[0]?.blocks[0]?.text,
    ).toBe("Question answered");
    expect(source[0]).toMatchObject({ status: "pending" });
  });
});
