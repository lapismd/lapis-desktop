import { describe, expect, it, vi } from "vitest";
import { AiChatController } from "../../../src/lib/ai/chat/chat-controller.svelte.ts";
import { transcriptCommentContext } from "../../../src/lib/ai/chat/transcript-context.ts";
import { projectAgentTurn } from "../../../src/lib/ai/core/context.ts";
import { FakeAgentRuntime } from "../support/fake-runtime.ts";

const submission = {
  id: "submission-one",
  text: "Explain this decision",
  comments: [
    {
      threadId: "thread",
      commentId: "comment",
      author: { id: "you", name: "You" },
      text: "Use a weekly review",
      anchor: {
        blockId: "answer/body",
        revision: "captured-version",
        from: 3,
        to: 8,
        quote: "daily",
      },
    },
  ],
};
describe("transcript comments as additional context", () => {
  it("preserves exact anchors and keeps authored text separate from injected context", () => {
    const blocks = transcriptCommentContext(submission);
    const projected = projectAgentTurn(submission.text, blocks);
    expect(projected.text).toBe("Explain this decision");
    expect(projected.context).toContain('kind="transcript-comments"');
    expect(JSON.parse(blocks[0]!.content).comments[0]).toEqual(
      submission.comments[0],
    );
    expect(transcriptCommentContext({ ...submission, comments: [] })).toEqual(
      [],
    );
  });
  it("dispatches a comments-only turn without manufacturing authored prompt text", async () => {
    const runtime = new FakeAgentRuntime();
    const controller = new AiChatController(runtime);
    try {
      const acknowledged = await controller.submit("", {
        contextBlocks: transcriptCommentContext({ ...submission, text: "" }),
      });
      expect(acknowledged).toBe(true);
      await vi.waitFor(() => expect(controller.busy).toBe(false));
      expect(runtime.sessions[0]!.prompts).toEqual([""]);
      expect(runtime.sessions[0]!.contextBlocks[0]?.[0]).toMatchObject({
        kind: "transcript-comments",
        id: "submission-one",
      });
      expect(
        controller.items.find(
          (item) => item.type === "message" && item.role === "user",
        ),
      ).toMatchObject({
        text: "",
        contextBlocks: [{ kind: "transcript-comments" }],
      });
    } finally {
      await controller.close();
    }
  });
  it("does not acknowledge a failed submission or dispatch while busy", async () => {
    const runtime = new FakeAgentRuntime();
    vi.spyOn(runtime, "start").mockRejectedValue(
      new Error("Agent unavailable"),
    );
    const controller = new AiChatController(runtime);
    const request = { contextBlocks: transcriptCommentContext(submission) };
    try {
      controller.busy = true;
      expect(await controller.submit("", request)).toBeUndefined();
      expect(runtime.start).not.toHaveBeenCalled();
      controller.busy = false;
      expect(await controller.submit("", request)).toBeUndefined();
      expect(controller.error).toContain("Agent unavailable");
      expect(controller.items[0]).toMatchObject({
        contextBlocks: request.contextBlocks,
      });
    } finally {
      await controller.close();
    }
  });
});
