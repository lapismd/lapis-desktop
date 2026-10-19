import { expect, it, vi } from "vitest";
import {
  TranscriptController,
  type TranscriptItem,
} from "@lapismd/design-core/chat";
import { navigateDiscussionReply } from "../../../src/lib/ai/chat/transcript-discussions.ts";

const item: TranscriptItem = {
  id: "captured-reply",
  kind: "message",
  label: "Assistant response",
  role: "assistant",
  replyContext: { threadId: "thread", commentIds: ["comment"] },
  blocks: [
    {
      id: "captured-reply/body",
      revision: "v1",
      kind: "markdown",
      label: "Assistant response",
      text: "Captured reply",
    },
  ],
};
it.each(["missing-reply", "missing-reader"])(
  "reports %s through one owned toast while preserving the authored draft",
  async (fault) => {
    const state = new TranscriptController(() => ({ items: [item] }));
    state.message = "Keep this authored draft";
    const notify = vi.fn();
    await navigateDiscussionReply(
      state,
      [item],
      fault === "missing-reply" ? "retired-reply" : item.id,
      { notify },
    );
    expect(notify).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        id: "ai-discussion-navigation-error",
        severity: "error",
        message: expect.stringContaining("captured agent reply"),
      }),
    );
    expect(state.message).toBe("Keep this authored draft");
    expect(state.error).toBe("");
  },
);
it("uses the public reader port with the exact captured block in either presentation", async () => {
  const state = new TranscriptController(() => ({ items: [item] }));
  const reader = vi.fn(),
    notify = vi.fn();
  state.readers.set("captured-reply/body", reader);
  await navigateDiscussionReply(state, [item], item.id, { notify });
  expect(reader).toHaveBeenCalledExactlyOnceWith(
    {
      blockId: "captured-reply/body",
      revision: "v1",
      from: 0,
      to: 0,
      quote: "",
    },
    true,
  );
  expect(notify).not.toHaveBeenCalled();
});
