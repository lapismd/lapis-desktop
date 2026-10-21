import { expect, it, vi } from "vitest";
import { AiChatController } from "../../../../src/lib/ai/chat/chat-controller.svelte.ts";
import type { AgentSession } from "../../../../src/lib/ai/core/runtime.ts";
import type { ApprovalRequest } from "../../../../src/lib/ai/core/approvals.ts";
import { FakeAgentRuntime } from "../../support/fake-runtime.ts";

const request = (): ApprovalRequest => ({
  id: "opaque-request",
  origin: "runtime",
  kind: "write",
  title: "Edit note",
  options: [
    { id: "not-an-allow-id", kind: "allow-once", label: "Approve edit" },
    { id: "allow-once", kind: "deny-once", label: "Refuse" },
  ],
});
async function fixture(policy: "ask" | "allow-all" = "allow-all") {
  const respond = vi.fn(async () => {});
  const controller = new AiChatController(new FakeAgentRuntime(), null, [], {
    approvalPolicy: () => policy,
  });
  const session: AgentSession = {
    id: "native",
    async *events() {
      yield { type: "permission.request", request: request() };
    },
    async send() {},
    respondToApproval: respond,
    async close() {},
  };
  controller.session = session;
  return {
    controller,
    session,
    respond,
    setPolicy: (next: typeof policy) => {
      policy = next;
    },
  };
}
it("automatically answers a live request using its exact one-time option and retains the approved trace", async () => {
  const f = await fixture();
  try {
    await f.controller._consume(f.session);
    expect(f.respond).toHaveBeenCalledExactlyOnceWith(
      "opaque-request",
      "not-an-allow-id",
    );
    expect(f.controller.items).toContainEqual(
      expect.objectContaining({ type: "approval", status: "approved" }),
    );
    expect(f.controller._approvalGrants).toEqual([]);
  } finally {
    await f.controller.close();
  }
});
it("asks by default and never retroactively approves an already pending request", async () => {
  const f = await fixture("ask");
  try {
    await f.controller._consume(f.session);
    f.setPolicy("allow-all");
    await new Promise((r) => setTimeout(r, 0));
    expect(f.respond).not.toHaveBeenCalled();
    expect(f.controller.items).toContainEqual(
      expect.objectContaining({ status: "pending" }),
    );
  } finally {
    await f.controller.close();
  }
});
it.each(["unknown", "allow-session", "allow-always", "deny-once"] as const)(
  "leaves %s semantics for explicit approval",
  async (kind) => {
    const f = await fixture();
    f.session.events = async function* () {
      yield {
        type: "permission.request",
        request: {
          ...request(),
          options: [{ id: "allow-once", label: "Allow", kind }],
        },
      };
    };
    try {
      await f.controller._consume(f.session);
      expect(f.respond).not.toHaveBeenCalled();
    } finally {
      await f.controller.close();
    }
  },
);
it("restricted processors cannot auto approve", async () => {
  const f = await fixture();
  f.controller._sessionRequest = { restricted: true };
  try {
    await f.controller._consume(f.session);
    expect(f.respond).not.toHaveBeenCalled();
  } finally {
    await f.controller.close();
  }
});
it.each(["cancelled", "replaced", "revoked"])(
  "refuses an automatic reply after the request becomes %s",
  async (state) => {
    const f = await fixture();
    f.controller._persist = async () => {
      if (state === "cancelled") f.controller._cancelledSessions.add(f.session);
      if (state === "replaced") f.controller.session = null;
      if (state === "revoked") f.setPolicy("ask");
    };
    try {
      await f.controller._consume(f.session);
      expect(f.respond).not.toHaveBeenCalled();
    } finally {
      await f.controller.close();
    }
  },
);
it("an existing explicit denial cannot be overridden by the global auto setting", async () => {
  const f = await fixture();
  f.controller._approvalGrants = [
    { name: "edit_note", decision: "deny-always" },
  ];
  f.session.events = async function* () {
    yield {
      type: "permission.request",
      request: { ...request(), tool: { name: "edit_note" } },
    };
  };
  try {
    await f.controller._consume(f.session);
    expect(f.respond).not.toHaveBeenCalled();
  } finally {
    await f.controller.close();
  }
});
it("failed provider acknowledgement keeps the request pending and reports the failure", async () => {
  const report = vi.fn();
  const controller = new AiChatController(new FakeAgentRuntime(), null, [], {
    approvalPolicy: () => "allow-all",
    onApprovalError: report,
  });
  const session: AgentSession = {
    id: "failed",
    async *events() {
      yield { type: "permission.request", request: request() };
    },
    async send() {},
    async respondToApproval() {
      throw new Error("Provider refused the decision");
    },
    async close() {},
  };
  controller.session = session;
  try {
    await controller._consume(session);
    expect(report).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ message: "Provider refused the decision" }),
    );
    expect(controller.items).toContainEqual(
      expect.objectContaining({ status: "pending" }),
    );
  } finally {
    await controller.close();
  }
});
it("does not answer when publication before the decision fails", async () => {
  const f = await fixture();
  let attempts = 0;
  f.controller._persist = async () => {
    if (++attempts === 1) throw new Error("Disk full");
  };
  try {
    await f.controller._consume(f.session);
    expect(f.respond).not.toHaveBeenCalled();
    expect(f.controller.items).toContainEqual(
      expect.objectContaining({ status: "pending" }),
    );
  } finally {
    await f.controller.close();
  }
});
it("retains an acknowledged automatic decision when its first durable response write fails", async () => {
  const { ConversationRepository } = await import(
    "../../../../src/lib/ai/conversations/conversation-repository.ts"
  );
  const { MemoryTranscriptStore } = await import(
    "../../../../src/lib/ai/conversations/memory-transcript-store.ts"
  );
  const repository = new ConversationRepository(new MemoryTranscriptStore());
  const { location } = await repository.create({ scopeDir: "Notes" });
  const report = vi.fn(),
    respond = vi.fn(async () => {});
  const controller = new AiChatController(new FakeAgentRuntime(), null, [], {
    repository,
    location,
    approvalPolicy: () => "allow-all",
    onApprovalError: report,
  });
  const session: AgentSession = {
    id: "durable",
    async *events() {
      yield { type: "permission.request", request: request() };
      yield { type: "completed" };
    },
    async send() {},
    respondToApproval: respond,
    async close() {},
  };
  controller.session = session;
  const append = controller._appendDurableItems.bind(controller);
  let failed = false;
  controller._appendDurableItems = async (...args) => {
    if (
      !failed &&
      args[1].some((i) => i.type === "approval" && i.status === "approved")
    ) {
      failed = true;
      throw new Error("Response publication interrupted");
    }
    return append(...args);
  };
  try {
    await controller._consume(session);
    expect(respond).toHaveBeenCalledOnce();
    expect(report).toHaveBeenCalledOnce();
    expect((await repository.read(location)).transcript).toContainEqual(
      expect.objectContaining({
        type: "approval.response",
        requestId: "opaque-request",
        option: { id: "not-an-allow-id", label: "Approve edit" },
      }),
    );
  } finally {
    await controller.close();
  }
});
