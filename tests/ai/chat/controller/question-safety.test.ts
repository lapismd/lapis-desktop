import { expect, it, vi } from "vitest";
import { AiChatController } from "../../../../src/lib/ai/chat/chat-controller.svelte.ts";
import { FakeAgentRuntime } from "../../support/fake-runtime.ts";
it("keeps a question pending when the provider refuses the answer", async () => {
  const controller = new AiChatController(new FakeAgentRuntime());
  const respondToQuestion = vi.fn(async () => {
    throw new Error("question refused");
  });
  controller.session = {
    id: "native",
    async *events() {},
    async send() {},
    async respondToApproval() {},
    respondToQuestion,
    async close() {},
  };
  controller.items = [
    {
      id: "question",
      type: "question",
      status: "pending",
      request: {
        id: "question-request",
        title: "Choose",
        questions: [
          {
            id: "q",
            header: "Choice",
            prompt: "Choose one",
            allowOther: true,
            secret: true,
          },
        ],
      },
    },
  ];
  try {
    await expect(
      controller.respondToQuestion("question-request", {
        q: ["synthetic answer"],
      }),
    ).rejects.toThrow("question refused");
    expect(controller.items[0]).toMatchObject({
      type: "question",
      status: "pending",
    });
    expect(JSON.stringify(controller.items)).not.toContain("synthetic answer");
  } finally {
    await controller.close();
  }
});
