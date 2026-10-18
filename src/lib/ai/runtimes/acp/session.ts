// SPDX-License-Identifier: Apache-2.0
// Adapted ACP session seam: native ownership replaces legacy JS bridge callbacks.
import {
  sessionEventFrames,
  type AcpSessionClient,
  type SessionSnapshot,
} from "@lapismd/ai";
import type { AgentSession } from "../../core/runtime.ts";
import type { AgentSessionConfiguration } from "../../core/models.ts";
import type { AgentEvent } from "../../core/events.ts";
import type { ApprovalRequest } from "../../core/approvals.ts";
import { requireApprovalOption } from "../../core/approvals.ts";
import { prepareAgentTurn, type AgentTurnOptions } from "../../core/context.ts";
import { AsyncEventQueue } from "../../core/event-queue.ts";
import { mapAcpActivity, mapAcpTerminal } from "./event-mapper.ts";
import { mapAcpPermission } from "./permissions.ts";
import { configureAcpSession } from "./configuration.ts";
import { AgentTurnFailure } from "./wire.ts";

type ActiveTurn = { abort: AbortController; requestId?: string };
export class AcpAgentSession implements AgentSession {
  #native?: AcpSessionClient;
  readonly #events = new AsyncEventQueue<AgentEvent>();
  readonly #permissions = new Map<string, ApprovalRequest>();
  readonly #deciding = new Set<string>();
  #turn?: ActiveTurn;
  #configuring = false;
  #state: "active" | "detached" | "closed" = "active";
  #fatal?: Error;
  #close?: Promise<void>;
  readonly #maxDurationMs: number;
  constructor(maxDurationMs = 120_000) {
    this.#maxDurationMs = maxDurationMs;
  }
  get id(): string {
    return this.#native?.info.sessionId ?? "starting";
  }
  get pendingApprovals(): string[] {
    return [...this.#permissions.keys()];
  }
  bind(native: AcpSessionClient): void {
    if (this.#native) throw new Error("ACP already bound");
    this.#native = native;
  }
  events(): AsyncIterable<AgentEvent> {
    return this.#events;
  }
  consume(snapshot: SessionSnapshot): void {
    for (const event of snapshot.events) {
      const frames = sessionEventFrames(event);
      for (const [frameIndex, frame] of frames.entries()) {
        const source = {
          sessionId: frame.sessionId ?? event.frame.sessionId ?? this.id,
          runId: frame.requestId,
          sequence: event.sequence,
          ...(frames.length > 1 ? { frameIndex } : {}),
        };
        if (frame.type === "activity")
          this.#events.push(mapAcpActivity(frame.update, source));
        if (frame.type === "permission") {
          const request = mapAcpPermission(frame);
          if (this.#permissions.has(request.id))
            throw new Error("Duplicate ACP permission");
          this.#permissions.set(request.id, request);
          this.#events.push({
            type: "permission.request",
            request,
            source,
            observation: frame,
          });
        }
        if (
          frame.type === "permission_resolved" &&
          typeof frame.permissionId === "string"
        )
          this.#permissions.delete(frame.permissionId);
        if (
          frame.type === "record" ||
          (frame.type === "error" && frame.requestId === this.#turn?.requestId)
        ) {
          this.#permissions.clear();
          const event = mapAcpTerminal(frame, source);
          this.#events.push(event);
          if (
            (event.type === "error" &&
              (event.error as AgentTurnFailure).outcome === "unknown") ||
            frame.sessionUsable === false
          )
            this.#fatal =
              event.type === "error"
                ? event.error
                : new AgentTurnFailure("session_unusable");
        }
      }
    }
  }
  fail(error: Error): void {
    if (this.#state !== "active" || this.#fatal) return;
    this.#fatal = error;
    this.#permissions.clear();
    this.#events.push({ type: "error", error });
  }
  async send(text: string, options: AgentTurnOptions = {}): Promise<void> {
    const native = this.#ready();
    if (this.#turn || this.#configuring) throw new Error("ACP session busy");
    const turn: ActiveTurn = { abort: new AbortController() };
    this.#turn = turn;
    try {
      const prepared = await prepareAgentTurn(text, options, turn.abort.signal);
      this.#ready();
      turn.abort.signal.throwIfAborted();
      turn.requestId = crypto.randomUUID();
      const frame = await native.send(turn.requestId, {
        type: "prompt",
        ...prepared,
        max_duration_ms: this.#maxDurationMs,
      });
      const result = mapAcpTerminal(frame, {
        sessionId: this.id,
        runId: turn.requestId,
        sequence: native.sequence,
      });
      if (result.type === "error") throw result.error;
    } catch (error) {
      if (
        error instanceof Error &&
        "outcome" in error &&
        error.outcome === "unknown"
      )
        this.fail(error);
      throw error;
    } finally {
      if (this.#turn === turn) this.#turn = undefined;
    }
  }
  async configure(input: AgentSessionConfiguration) {
    const native = this.#ready();
    if (this.#turn || this.#configuring) throw new Error("ACP session busy");
    this.#configuring = true;
    try {
      return await configureAcpSession(native, input);
    } finally {
      this.#configuring = false;
    }
  }
  async respondToApproval(requestId: string, optionId: string): Promise<void> {
    const request = this.#permissions.get(requestId);
    if (!request) throw new Error("Unknown approval request");
    requireApprovalOption(request, optionId);
    await this.#answer(requestId, optionId);
  }
  async cancelApproval(requestId: string): Promise<void> {
    await this.#answer(requestId, null);
  }
  async #answer(id: string, option: string | null): Promise<void> {
    const native = this.#ready();
    if (!this.#permissions.has(id) || this.#deciding.has(id))
      throw new Error("Unknown approval request");
    this.#deciding.add(id);
    try {
      const frame = await native.send(crypto.randomUUID(), {
        type: "permission",
        permission_id: id,
        option_id: option,
      });
      if (frame.type === "error")
        throw new AgentTurnFailure(String(frame.code), "rejected");
      this.#permissions.delete(id);
    } catch (error) {
      if (
        error instanceof Error &&
        "outcome" in error &&
        error.outcome === "unknown"
      ) {
        this.#permissions.delete(id);
        this.fail(error);
      }
      throw error;
    } finally {
      this.#deciding.delete(id);
    }
  }
  async cancel(): Promise<void> {
    const turn = this.#turn;
    if (!turn) return;
    turn.abort.abort();
    if (turn.requestId) {
      const frame = await this.#ready().send(crypto.randomUUID(), {
        type: "cancel",
        target: turn.requestId,
      });
      if (frame.type === "error")
        throw new AgentTurnFailure(String(frame.code), "rejected");
    }
  }
  async detach(): Promise<void> {
    if (this.#state !== "active") return;
    this.#state = "detached";
    this.#turn?.abort.abort();
    this.#permissions.clear();
    try {
      await this.#native?.detach();
    } finally {
      this.#events.close();
    }
  }
  close(): Promise<void> {
    this.#close ??= this.#stop();
    return this.#close;
  }
  async #stop(): Promise<void> {
    this.#state = "closed";
    this.#turn?.abort.abort();
    this.#permissions.clear();
    try {
      await this.#native?.close();
    } finally {
      this.#events.close();
    }
  }
  #ready(): AcpSessionClient {
    if (!this.#native || this.#state !== "active" || this.#fatal)
      throw new Error("ACP session unavailable");
    return this.#native;
  }
}
