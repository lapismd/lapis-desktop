import { describe, expect, it, vi } from "vitest";
import { AiChatController } from "../../../../src/lib/ai/chat/chat-controller.svelte.ts";
import { ConversationRepository } from "../../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../../src/lib/ai/conversations/memory-transcript-store.ts";
import type {
  ApprovalOption,
  ApprovalRequest,
} from "../../../../src/lib/ai/core/approvals.ts";
import type { AgentSession } from "../../../../src/lib/ai/core/runtime.ts";
import { FakeAgentRuntime } from "../../support/fake-runtime.ts";

async function fixture(options: ApprovalOption[], reject = false) {
  const repository = new ConversationRepository(new MemoryTranscriptStore());
  const { location } = await repository.create({
    id: "123e4567-e89b-42d3-a456-426614174000",
    scopeDir: "Projects",
  });
  const request: ApprovalRequest = {
    id: "permission",
    origin: "runtime",
    kind: "write",
    title: "Write note",
    tool: { name: "notes_write" },
    options,
  };
  const respond = vi.fn(async (_id: string, _choice: string) => {
    if (reject) throw new Error("provider refused");
  });
  const session: AgentSession = {
    id: "native",
    async *events() {},
    async send() {},
    respondToApproval: respond,
    async close() {},
  };
  const controller = new AiChatController(new FakeAgentRuntime(), null, [], {
    repository,
    location,
  });
  controller.session = session;
  controller.items = [
    { id: "approval", type: "approval", request, status: "pending" },
  ];
  return { controller, repository, location, request, respond, session };
}
describe("native approval identity and durable grants", () => {
  it("rejects an unadvertised choice before storing a permanent grant", async () => {
    const { controller, repository, location, respond } = await fixture([
      { id: "opaque-deny", kind: "deny-once", label: "Deny" },
    ]);
    try {
      await expect(
        controller.respondToApproval("permission", "allow-always"),
      ).rejects.toThrow();
      expect(
        (await repository.read(location)).metadata.approvalGrants,
      ).toBeUndefined();
      expect(respond).not.toHaveBeenCalled();
    } finally {
      await controller.close();
    }
  });
  it("does not turn an allow-looking ID with deny semantics into a grant", async () => {
    const { controller, repository, location, respond } = await fixture([
      { id: "allow-always", kind: "deny-once", label: "Deny" },
    ]);
    try {
      await controller.respondToApproval("permission", "allow-always");
      expect(respond).toHaveBeenCalledWith("permission", "allow-always");
      expect(
        (await repository.read(location)).metadata.approvalGrants,
      ).toBeUndefined();
    } finally {
      await controller.close();
    }
  });
  it("stores persistent advertised semantics while forwarding the opaque ID exactly", async () => {
    const { controller, repository, location, respond } = await fixture([
      { id: "custom-policy-v2", kind: "allow-always", label: "Allow always" },
    ]);
    try {
      await controller.respondToApproval("permission", "custom-policy-v2");
      expect(respond).toHaveBeenCalledWith("permission", "custom-policy-v2");
      expect((await repository.read(location)).metadata.approvalGrants).toEqual(
        [expect.objectContaining({ decision: "allow-always" })],
      );
    } finally {
      await controller.close();
    }
  });
  it("does not project an answer or retain a grant when the provider refuses it", async () => {
    const { controller, repository, location } = await fixture(
      [{ id: "allow-always", kind: "allow-always", label: "Allow always" }],
      true,
    );
    try {
      await expect(
        controller.respondToApproval("permission", "allow-always"),
      ).rejects.toThrow("provider refused");
      expect(controller.items[0]).toMatchObject({
        type: "approval",
        status: "pending",
      });
      expect(
        (await repository.read(location)).metadata.approvalGrants,
      ).toBeUndefined();
    } finally {
      await controller.close();
    }
  });
  it("uses the advertised opaque option for a stored semantic decision", async () => {
    const { controller, request, session, respond } = await fixture([
      { id: "opaque-policy", kind: "allow-always", label: "Allow always" },
    ]);
    controller._approvalGrants = [
      { name: "notes_write", decision: "allow-always" },
    ];
    session.events = async function* () {
      yield { type: "permission.request", request };
    };
    try {
      await controller._consume(session);
      expect(respond).toHaveBeenCalledWith("permission", "opaque-policy");
    } finally {
      await controller.close();
    }
  });
});
