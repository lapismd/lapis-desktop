import { AsyncEventQueue } from "../../../src/lib/ai/core/event-queue.ts";
import type {
  AgentCapabilities,
  AgentRequest,
  AgentRuntime,
  AgentSession,
} from "../../../src/lib/ai/core/runtime.ts";
import type { AgentEvent } from "../../../src/lib/ai/core/events.ts";
import type { AgentTurnOptions } from "../../../src/lib/ai/core/context.ts";
import type { UserInputAnswers } from "../../../src/lib/ai/core/approvals.ts";
import { describe, expect, it, vi } from "vitest";
import { RuntimeMemoryConsolidationProvider } from "../../../src/lib/ai/memory/runtime-consolidation-provider.ts";
import type { GroundedConsolidationInput } from "../../../src/lib/ai/memory/types.ts";

const INPUT: GroundedConsolidationInput = {
  scope: { kind: "project", projectDir: "Projects/Atlas" },
  candidates: [
    {
      id: "candidate-1",
      claim: "Atlas uses compact headings",
      evidence: [
        {
          conversationId: "conversation-1",
          entryId: "entry-1",
          entryHash: "a".repeat(64),
          observedAt: "2026-08-27T12:00:00.000Z",
          scopeDirAtObservation: "Projects/Atlas",
        },
      ],
    },
  ],
};

class ScriptedSession implements AgentSession {
  readonly id = "consolidation-session";
  readonly #events = new AsyncEventQueue<AgentEvent>();
  readonly send = vi.fn(async (_input: string, _options?: AgentTurnOptions) => {
    for (const event of this.script) this.#events.push(event);
  });
  readonly cancel = vi.fn(async () => undefined);
  readonly close = vi.fn(async () => this.#events.close());

  constructor(private readonly script: AgentEvent[]) {}

  events(): AsyncIterable<AgentEvent> {
    return this.#events;
  }

  async respondToApproval(): Promise<void> {}

  async respondToQuestion(
    _requestId: string,
    _answers: UserInputAnswers,
  ): Promise<void> {}
}

class ScriptedRuntime implements AgentRuntime {
  readonly id = "acp";
  readonly start = vi.fn(async (request: AgentRequest) => {
    this.request = request;
    return this.session;
  });
  request?: AgentRequest;

  constructor(readonly session: ScriptedSession) {}

  capabilities(): AgentCapabilities {
    return {
      sessions: true,
      resume: false,
      cancel: true,
      steer: false,
      modelSelection: true,
      nativeTools: true,
      mcpTools: true,
      approvals: {
        supported: true,
        interactive: true,
        persistentDecisions: false,
        granularPermissions: false,
        policyAmendments: false,
      },
    };
  }

  async supports(): Promise<boolean> {
    return true;
  }
}

function providerFor(runtime: ScriptedRuntime) {
  return new RuntimeMemoryConsolidationProvider({
    configuration: () => ({
      runtimeId: "acp",
      agent: "codex",
      model: "pinned-memory-model",
    }),
    resolveRuntime: async () => runtime,
  });
}

describe("RuntimeMemoryConsolidationProvider", () => {
  it("runs a pinned restricted request without workspace capabilities", async () => {
    const proposal = {
      memories: [
        {
          candidateIds: ["candidate-1"],
          kind: "preference",
          scope: INPUT.scope,
          importance: 4,
          triggers: ["atlas", "headings"],
          summary: "Atlas uses compact headings",
        },
      ],
    };
    const session = new ScriptedSession([
      { type: "text", text: JSON.stringify(proposal) },
      { type: "completed" },
    ]);
    const runtime = new ScriptedRuntime(session);

    await expect(providerFor(runtime).propose(INPUT)).resolves.toEqual(
      proposal,
    );

    expect(runtime.request).toMatchObject({
      prompt: "",
      agent: "codex",
      model: { provider: "codex", model: "pinned-memory-model" },
      thinking: "low",
      mcpServers: [],
      restricted: true,
      requireApprovals: false,
      requirePolicyAmendments: false,
      metadata: { runtime: "acp", purpose: "memory-consolidation" },
    });
    expect(runtime.request).not.toHaveProperty("workspace");
    expect(runtime.request).not.toHaveProperty("appToolSession");
    expect(runtime.request).not.toHaveProperty("skillSnapshot");
    expect(session.send.mock.calls[0]?.[0]).toContain('"candidate-1"');
    expect(session.send.mock.calls[0]?.[0]).not.toContain(
      "scopeDirAtObservation",
    );
    expect(session.close).toHaveBeenCalledOnce();
  });

  it("cancels and rejects a runtime that emits a tool event", async () => {
    const session = new ScriptedSession([
      { type: "tool.start", id: "tool-1", name: "read" },
      { type: "completed" },
    ]);
    const runtime = new ScriptedRuntime(session);

    await expect(providerFor(runtime).propose(INPUT)).rejects.toThrow(
      "forbidden runtime event: tool.start",
    );
    expect(session.cancel).toHaveBeenCalledOnce();
    expect(session.close).toHaveBeenCalledOnce();
  });

  it("rejects malformed output without returning a proposal", async () => {
    const session = new ScriptedSession([
      { type: "text", text: "not-json" },
      { type: "completed" },
    ]);
    const runtime = new ScriptedRuntime(session);

    await expect(providerFor(runtime).propose(INPUT)).rejects.toThrow();
    expect(session.close).toHaveBeenCalledOnce();
  });

  it("does not resolve or start a runtime for a pre-cancelled maintenance request", async () => {
    const runtime = new ScriptedRuntime(
      new ScriptedSession([{ type: "completed" }]),
    );
    const resolveRuntime = vi.fn(async () => runtime);
    const provider = new RuntimeMemoryConsolidationProvider({
      configuration: () => ({
        runtimeId: "acp",
        agent: "codex",
        model: "pinned",
      }),
      resolveRuntime,
    });
    const signal = AbortSignal.abort(new Error("request cancelled"));
    await expect(provider.propose(INPUT, signal)).rejects.toThrow(
      "request cancelled",
    );
    expect(resolveRuntime).not.toHaveBeenCalled();
    expect(runtime.start).not.toHaveBeenCalled();
  });

  it("does not start after cancellation while runtime selection is pending", async () => {
    const session = new ScriptedSession([{ type: "completed" }]);
    const runtime = new ScriptedRuntime(session);
    const controller = new AbortController();
    const provider = new RuntimeMemoryConsolidationProvider({
      configuration: () => ({
        runtimeId: "acp",
        agent: "codex",
        model: "pinned",
      }),
      resolveRuntime: async () => {
        controller.abort(new Error("selection cancelled"));
        return runtime;
      },
    });
    await expect(provider.propose(INPUT, controller.signal)).rejects.toThrow(
      "selection cancelled",
    );
    expect(runtime.start).not.toHaveBeenCalled();
  });

  it("closes without sending when cancellation happens during startup", async () => {
    const session = new ScriptedSession([]);
    const runtime = new ScriptedRuntime(session);
    const controller = new AbortController();
    runtime.start.mockImplementation(async () => {
      controller.abort(new Error("startup cancelled"));
      return session;
    });
    await expect(
      providerFor(runtime).propose(INPUT, controller.signal),
    ).rejects.toThrow("startup cancelled");
    expect(session.send).not.toHaveBeenCalled();
    expect(session.close).toHaveBeenCalledOnce();
  });
});
