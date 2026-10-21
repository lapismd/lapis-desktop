import { expect, it, vi } from "vitest";
import { AiChatController } from "../../../../src/lib/ai/chat/chat-controller.svelte.ts";
import { FakeAgentRuntime } from "../../support/fake-runtime.ts";
import { fixture } from "../../native/app-tools-fixture.ts";
import type { AgentSession } from "../../../../src/lib/ai/core/runtime.ts";

it("automatically approves an admitted app-tool write through the normal broker without creating a session grant", async () => {
  const tools = fixture("write");
  const descriptor = await tools.bridge.prepare(tools.input);
  await tools.bridge.arm(descriptor.bridgeId!, "turn");
  const runtime = new FakeAgentRuntime();
  const controller = new AiChatController(runtime, null, [], {
    appToolBridge: tools.bridge,
    approvalPolicy: () => "allow-all",
  });
  const session: AgentSession = {
    id: "provider",
    async *events() {},
    async send() {},
    async close() {},
    respondToApproval: vi.fn(),
  };
  controller.session = session;
  controller._activeBindingId = tools.input.agentBindingId;
  try {
    for (let i = 0; i < 2; i++) {
      tools.event({
        type: "call",
        bridgeId: descriptor.bridgeId!,
        invocationId: `invoke-${i}`,
        turnId: "turn",
        name: "notes_read",
        arguments: {},
      });
      await vi.waitFor(() =>
        expect(tools.execute).toHaveBeenCalledTimes(i + 1),
      );
    }
    expect(controller.items.filter((i) => i.type === "approval")).toHaveLength(
      2,
    );
    expect(
      controller.items
        .filter((i) => i.type === "approval")
        .every((i) => i.status === "approved"),
    ).toBe(true);
    expect(session.respondToApproval).not.toHaveBeenCalled();
    expect(controller._approvalGrants).toEqual([]);
    // Existing broker still enforces exact request/choice identity.
    expect(tools.bridge.respondToApproval("stale", "allow-once")).toBe(false);
  } finally {
    await controller.close();
    await tools.bridge.close();
    tools.host.close();
  }
});
