import { expect, it, vi } from "vitest";
import { AiChatController } from "../../../../src/lib/ai/chat/chat-controller.svelte.ts";
import type { AiChatItem } from "../../../../src/lib/ai/chat/chat-items.ts";
import { FakeAgentRuntime } from "../../support/fake-runtime.ts";

function fixture(type: "approval" | "question") {
  const controller = new AiChatController(new FakeAgentRuntime());
  const respond = vi.fn(async (_id: string, _value: unknown) => {});
  controller._activeBindingId = "writer";
  controller.session = {
    id: "writer-native",
    async *events() {},
    async send() {},
    respondToApproval: respond,
    respondToQuestion: respond,
    async close() {},
  };
  const request =
    type === "approval"
      ? {
          id: "permission-10",
          origin: "runtime" as const,
          kind: "read" as const,
          title: "Read note",
          options: [
            { id: "opaque-allow", kind: "allow-once" as const, label: "Allow" },
          ],
        }
      : {
          id: "permission-10",
          title: "Choose",
          questions: [
            {
              id: "q",
              header: "Choice",
              prompt: "Choose",
              allowOther: true,
              secret: false,
            },
          ],
        };
  const old = {
    id: "reviewer-request",
    type,
    request,
    agentBindingId: "reviewer",
    status: type === "approval" ? "approved" : "answered",
  } as AiChatItem;
  const current = {
    id: "writer-request",
    type,
    request: structuredClone(request),
    agentBindingId: "writer",
    status: "pending",
  } as AiChatItem;
  controller.items = [old, current];
  return { controller, respond, old, current };
}
for (const type of ["approval", "question"] as const) {
  it(`answers only the active binding's ${type} when native request IDs repeat`, async () => {
    const { controller, respond, old } = fixture(type);
    try {
      if (type === "approval")
        await controller.respondToApproval("permission-10", "opaque-allow");
      else await controller.respondToQuestion("permission-10", { q: ["yes"] });
      expect(respond).toHaveBeenCalledTimes(1);
      expect(respond.mock.calls[0]).toEqual([
        "permission-10",
        type === "approval" ? "opaque-allow" : { q: ["yes"] },
      ]);
      expect(controller.items[0]).toBe(old);
      expect(controller.items[1]).toMatchObject({
        status: type === "approval" ? "approved" : "answered",
      });
    } finally {
      await controller.close();
    }
  });
  it(`refuses a stale ${type} action instead of forwarding it to a new binding`, async () => {
    const { controller, respond } = fixture(type);
    try {
      const action =
        type === "approval"
          ? controller.respondToApproval(
              "permission-10",
              "opaque-allow",
              "reviewer-request",
            )
          : controller.respondToQuestion(
              "permission-10",
              { q: ["yes"] },
              "reviewer-request",
            );
      await expect(action).rejects.toThrow(/Unknown/);
      expect(respond).not.toHaveBeenCalled();
      expect(controller.items[1]).toMatchObject({ status: "pending" });
    } finally {
      await controller.close();
    }
  });
}
