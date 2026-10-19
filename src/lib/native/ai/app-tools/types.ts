import type { AgentEvent } from "../../../ai/core/events.ts";
import type { AppToolSessionDescriptor } from "../../../ai/core/runtime.ts";
import type { AppToolBridgeListener } from "../../../ai/tools/app-tool-bridge.ts";

export type NativeToolEvent =
  | {
      type: "call";
      bridgeId: string;
      invocationId: string;
      turnId: string;
      name: string;
      arguments: unknown;
    }
  | { type: "cancel"; bridgeId: string; invocationId: string };
export type Outcome =
  | { type: "completed"; value: unknown }
  | { type: "rejected" | "invalid" | "unknown" };
export type Operation =
  | {
      type: "open";
      tools: Array<{
        name: string;
        description: string;
        inputSchema: Record<string, unknown>;
      }>;
    }
  | { type: "arm" | "end"; turnId: string }
  | { type: "reply"; invocationId: string; outcome: Outcome }
  | { type: "close" };
export interface ToolPort {
  prepare(): Promise<void>;
  listen(receive: (event: NativeToolEvent) => void): Promise<() => void>;
  request(id: string, operation: Operation): Promise<void>;
  work<T>(title: string, task: () => Promise<T>): Promise<T>;
  report(error: Error): void;
}
export type ActiveCall = {
  abort: AbortController;
  done: Promise<void>;
  runId: string;
};
export type BridgeRecord = {
  bindingId: string;
  bridgeId: string;
  descriptor: AppToolSessionDescriptor;
  opening?: Promise<void>;
  nativeAttempted: boolean;
  closing: boolean;
  close?: Promise<void>;
  turnId?: string;
  failed?: Error;
  reported?: boolean;
  calls: Map<string, ActiveCall>;
  seen: Set<string>;
  cancelled: Set<string>;
  replies: Map<string, Outcome>;
  sequence: number;
};
export async function emit(
  listeners: Set<AppToolBridgeListener>,
  record: BridgeRecord,
  event: AgentEvent,
): Promise<void> {
  if (!record.turnId) throw new Error("Application tool has no active turn");
  const source = {
    sessionId: record.bridgeId,
    runId: record.turnId,
    sequence: ++record.sequence,
  };
  const results = await Promise.allSettled(
    [...listeners].map(async (listener) =>
      listener({
        bindingId: record.bindingId,
        event: {
          ...event,
          source,
        },
      }),
    ),
  );
  const errors = results.flatMap((result) =>
    result.status === "rejected" ? [result.reason] : [],
  );
  if (errors.length)
    throw new AggregateError(errors, "Application tool publication failed");
}
export function failure(record: BridgeRecord, error: unknown): Error {
  return (record.failed ??=
    error instanceof Error
      ? error
      : new Error("Application tool outcome is unknown"));
}
export function reportFailure(record: BridgeRecord, port: ToolPort): void {
  if (record.failed && !record.reported) {
    record.reported = true;
    port.report(record.failed);
  }
}
