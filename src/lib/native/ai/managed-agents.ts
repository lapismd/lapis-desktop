import { OwnedAiWork, type AiWorkRunner } from "../../ai/core/owned-work.ts";
import type { AgentRequest, AgentSession } from "../../ai/core/runtime.ts";
import type { PreparedCanonicalCapture } from "../../ai/conversations/backend-port.ts";
import type { ManagedAgentLauncher } from "../../ai/conversations/managed-turn-types.ts";
import {
  AcpAgentRuntime,
  type AcpRuntimeBackend,
} from "../../ai/runtimes/acp/runtime.ts";
import { handle } from "./backends/wire.ts";

/** Native capture grants launch workers; normalized renderer events are display only. */
export class NativeManagedAgents implements ManagedAgentLauncher {
  readonly #work: OwnedAiWork;
  readonly #turns: OwnedAiWork;
  readonly #sessions = new Set<AgentSession>();
  readonly #stopped = new WeakMap<AgentSession, () => Promise<void>>();
  readonly #stoppingStreams = new WeakMap<AgentSession, () => Promise<void>>();
  readonly #probe: AcpAgentRuntime;
  #closed = false;
  #closing?: Promise<void>;
  constructor(
    private readonly backend: Pick<AcpRuntimeBackend, "client" | "close">,
    work?: { preparation?: AiWorkRunner; turn?: AiWorkRunner },
    private readonly onStopped?: (sessionId: string) => void,
  ) {
    this.#work = new OwnedAiWork(work?.preparation);
    this.#turns = new OwnedAiWork(work?.turn);
    this.#probe = new AcpAgentRuntime(backend);
  }
  supports(request: AgentRequest): Promise<boolean> {
    if (this.#closed) return Promise.resolve(false);
    return this.#work.run(() => this.#supports(request));
  }
  async #supports(request: AgentRequest): Promise<boolean> {
    const preference = request.metadata?.runtime;
    if (
      this.#closed ||
      request.agent !== "codex" ||
      request.appToolSession?.status === "available" ||
      (preference !== undefined &&
        preference !== "auto" &&
        preference !== "acp")
    )
      return false;
    return (await this.#probe.supports(request)) && !this.#closed;
  }
  start(
    prepared: PreparedCanonicalCapture,
    request: AgentRequest,
  ): Promise<AgentSession> {
    if (this.#closed)
      return Promise.reject(new Error("Managed agents are closed"));
    const targetId = handle(prepared.targetId);
    const captured = structuredClone(request);
    return this.#work.run<AgentSession>(async () => {
      if (!(await this.#supports(captured)))
        throw new Error(
          "The admitted client cannot run this native conversation",
        );
      const runtime = new AcpAgentRuntime({
        ...this.backend,
        launchTarget: async (_request, provider) => {
          if (this.#closed || provider !== "codex")
            throw new Error("Managed agent launch is unavailable");
          return targetId;
        },
      });
      const session = await runtime.start(captured);
      this.#sessions.add(session);
      let nativeStopped = false;
      let streamFenced = false;
      const close = async () => {
        if (!nativeStopped) await session.close();
        this.#sessions.delete(session);
      };
      if (this.#closed) {
        await close();
        throw new Error("Managed agent launch was closed");
      }
      const managed: AgentSession = {
        get id() {
          return session.id;
        },
        events: () => session.events(),
        send: (text, options) =>
          this.#closed
            ? Promise.reject(new Error("Managed agents are closed"))
            : this.#turns.run(() => session.send(text, options)),
        configure: (input) => session.configure(input),
        respondToApproval: (id, option) =>
          session.respondToApproval(id, option),
        cancelApproval: (id) => session.cancelApproval(id),
        cancel: () => session.cancel(),
        // A detached worker remains owned until service closure or explicit Close.
        detach: () => session.detach(),
        close,
      };
      this.#stoppingStreams.set(managed, async () => {
        streamFenced = true;
        await session.detach();
      });
      this.#stopped.set(managed, async () => {
        if (!streamFenced)
          throw new Error("Fence renderer streams before native closure");
        // Native Stop has confirmed this exact worker closed; retire only
        // local bookkeeping, including a formerly uncertain detach request.
        nativeStopped = true;
        this.onStopped?.(session.id);
        this.#sessions.delete(session);
      });
      return managed;
    });
  }
  async prepareStop(session: AgentSession): Promise<void> {
    const detach = this.#stoppingStreams.get(session);
    if (!detach)
      throw new Error("Managed session is not owned by this launcher");
    await detach();
  }
  async releaseStopped(session: AgentSession): Promise<void> {
    const release = this.#stopped.get(session);
    if (!release)
      throw new Error("Managed session is not owned by this launcher");
    await release();
    this.#stopped.delete(session);
    this.#stoppingStreams.delete(session);
  }
  close(): Promise<void> {
    this.#closed = true;
    return (this.#closing ??= this.#stop().catch((error) => {
      this.#closing = undefined;
      throw error;
    }));
  }
  async #stop(): Promise<void> {
    // Close active workers before waiting for prompts that need their terminal
    // result. A failed close remains owned; do not wait forever on that turn.
    await this.#closeSessions();
    await this.#work.settle();
    await this.#closeSessions();
    await this.#turns.settle();
  }
  async #closeSessions(): Promise<void> {
    const results = await Promise.allSettled(
      [...this.#sessions].map(async (session) => {
        await session.close();
        this.#sessions.delete(session);
      }),
    );
    const errors = results.flatMap((result) =>
      result.status === "rejected" ? [result.reason] : [],
    );
    if (errors.length)
      throw new AggregateError(errors, "Managed agent cleanup failed");
  }
}
