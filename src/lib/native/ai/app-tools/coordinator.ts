// Adapted from lapis-plugins' desktop-app-tool-bridge; no controller dependency.
import type {
  AppToolBridgeCoordinator,
  AppToolBridgeListener,
} from "../../../ai/tools/app-tool-bridge.ts";
import type { AppToolHost } from "../../../ai/tools/app-tool-host.ts";
import type { CreateAppToolSessionInput } from "../../../ai/tools/app-tool-contracts.ts";
import type { AppToolSessionDescriptor } from "../../../ai/core/runtime.ts";
import {
  emit,
  failure,
  reportFailure,
  type BridgeRecord,
  type ToolPort,
} from "./types.ts";
import { receive } from "./invocation.ts";

export class NativeAppTools implements AppToolBridgeCoordinator {
  readonly #records = new Map<string, BridgeRecord>();
  readonly #seen = new Set<string>();
  readonly #listeners = new Set<AppToolBridgeListener>();
  readonly #approvals: () => void;
  #listening?: Promise<void>;
  #unlisten?: () => void;
  #closing = false;
  constructor(
    private readonly host: AppToolHost,
    private readonly port: ToolPort,
  ) {
    this.#approvals = host.approvals.subscribe(
      (request, bindingId, invocationId) => {
        const record = this.#records.get(bindingId);
        const active = invocationId
          ? record?.calls.get(invocationId)
          : undefined;
        if (!record || !active) {
          host.approvals.respond(request.id, "deny-once");
          return;
        }
        return emit(this.#listeners, record, {
          type: "permission.request",
          request,
        }).catch((error) => {
          failure(record, error);
          active.abort.abort();
          reportFailure(record, this.port);
          throw error;
        });
      },
    );
  }
  async prepare(
    input: CreateAppToolSessionInput,
  ): Promise<AppToolSessionDescriptor> {
    if (
      this.#closing ||
      this.#seen.has(input.agentBindingId) ||
      this.#seen.size >= 4096
    )
      throw new Error("Application tool binding is unavailable");
    this.#seen.add(input.agentBindingId);
    const descriptor = this.host.createSession(input);
    const record: BridgeRecord = {
      bindingId: input.agentBindingId,
      bridgeId: crypto.randomUUID(),
      descriptor,
      nativeAttempted: false,
      closing: false,
      calls: new Map(),
      seen: new Set(),
      cancelled: new Set(),
      replies: new Map(),
      sequence: 0,
    };
    this.#records.set(input.agentBindingId, record);
    if (!input.runtimeSupportsAppTools)
      return {
        ...descriptor,
        status: "runtime-unavailable",
        unavailableReason:
          "The selected runtime does not support application tools.",
      };
    if (!descriptor.tools.length) return { ...descriptor, status: "disabled" };
    record.opening = this.port.work("Preparing application tools", async () => {
      await this.port.prepare();
      this.#listening ??= this.port
        .listen((event) => {
          const original = [...this.#records.values()].find(
            (r) => r.bridgeId === event.bridgeId,
          );
          if (original)
            receive(original, event, this.host, this.port, this.#listeners);
        })
        .then((unlisten) => {
          this.#unlisten = unlisten;
        })
        .catch((error) => {
          this.#listening = undefined;
          throw error;
        });
      await this.#listening;
      if (this.#closing || record.closing)
        throw new Error("Application tool preparation was cancelled");
      record.nativeAttempted = true;
      await this.port.request(record.bridgeId, {
        type: "open",
        tools: descriptor.tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      });
    });
    try {
      await record.opening;
      if (record.closing || this.#closing)
        throw new Error("Application tool preparation was cancelled");
      return Object.freeze({
        ...descriptor,
        bridgeId: record.bridgeId,
        status: "available",
      });
    } catch (error) {
      try {
        await this.closeBinding(record.bindingId);
      } catch (cleanup) {
        throw new AggregateError(
          [error, cleanup],
          "Application tool preparation cleanup is unknown",
        );
      }
      throw error;
    }
  }
  target(
    descriptor: AppToolSessionDescriptor | undefined,
    base: string,
  ): string {
    if (descriptor?.status !== "available") return base;
    const record = this.#records.get(descriptor.agentBindingId);
    if (
      !record ||
      record.closing ||
      record.failed ||
      record.bridgeId !== descriptor.bridgeId ||
      base !== "codex"
    )
      throw new Error("Application tool binding is unavailable");
    return `codex:tools:${record.bridgeId}`;
  }
  #record(bridgeId: string): BridgeRecord {
    const record = [...this.#records.values()].find(
      (r) => r.bridgeId === bridgeId,
    );
    if (!record || record.closing || record.failed || !record.nativeAttempted)
      throw new Error("Application tool binding is unavailable");
    return record;
  }
  async arm(bridgeId: string, turnId: string): Promise<void> {
    const record = this.#record(bridgeId);
    if (record.turnId) throw new Error("Application tools are busy");
    record.turnId = turnId;
    try {
      await this.port.request(bridgeId, { type: "arm", turnId });
    } catch (error) {
      failure(record, error);
      throw error;
    }
  }
  async end(bridgeId: string, turnId: string): Promise<void> {
    const record = [...this.#records.values()].find(
      (r) => r.bridgeId === bridgeId,
    );
    if (!record || record.turnId !== turnId)
      throw new Error("Application tool turn is unavailable");
    try {
      await this.port.request(bridgeId, { type: "end", turnId });
      await boundedCalls(record);
      if (record.failed) throw record.failed;
      record.turnId = undefined;
    } catch (error) {
      failure(record, error);
      throw error;
    }
  }
  respondToApproval(id: string, option: string): boolean {
    return (
      (option === "allow-once" ||
        option === "allow-session" ||
        option === "deny-once") &&
      this.host.approvals.respond(id, option)
    );
  }
  subscribe(listener: AppToolBridgeListener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }
  closeBinding(id: string): Promise<void> {
    const record = this.#records.get(id);
    if (!record) return Promise.resolve();
    record.closing = true;
    return (record.close ??= this.#closeRecord(record).catch((error) => {
      record.close = undefined;
      throw error;
    }));
  }
  async #closeRecord(record: BridgeRecord): Promise<void> {
    for (const call of record.calls.values()) call.abort.abort();
    this.host.closeBinding(record.bindingId);
    await record.opening?.catch(() => undefined);
    // Reply-only reconciliation never invokes the application callback again.
    for (const [invocationId, outcome] of record.replies) {
      await this.port.request(record.bridgeId, {
        type: "reply",
        invocationId,
        outcome,
      });
      record.replies.delete(invocationId);
    }
    const results = await Promise.allSettled([
      this.host.drainBinding(record.bindingId),
      boundedCalls(record),
      record.nativeAttempted
        ? this.port.request(record.bridgeId, { type: "close" })
        : Promise.resolve(),
    ]);
    const errors = results.flatMap((r) =>
      r.status === "rejected" ? [r.reason] : [],
    );
    if (errors.length)
      throw new AggregateError(errors, "Application tool cleanup is unknown");
    this.#records.delete(record.bindingId);
  }
  async close(): Promise<void> {
    this.#closing = true;
    for (const id of [...this.#records.keys()]) await this.closeBinding(id);
    await this.#listening;
    this.#unlisten?.();
    this.#unlisten = undefined;
    this.#approvals();
    this.#listeners.clear();
  }
}
async function boundedCalls(record: BridgeRecord): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      Promise.all([...record.calls.values()].map((call) => call.done)),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Application tool cleanup is unknown")),
          5_000,
        );
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
