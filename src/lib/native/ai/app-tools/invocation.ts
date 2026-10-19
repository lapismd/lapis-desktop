// Adapted from Lapis' existing desktop-app-tool-bridge; Notes retains policy.
import type { AppToolHost } from "../../../ai/tools/app-tool-host.ts";
import { AppToolExecutionError } from "../../../ai/tools/app-tool-errors.ts";
import type { AppToolBridgeListener } from "../../../ai/tools/app-tool-bridge.ts";
import {
  emit,
  failure,
  reportFailure,
  type NativeToolEvent,
  type Outcome,
  type BridgeRecord,
  type ToolPort,
} from "./types.ts";

export function receive(
  record: BridgeRecord,
  event: NativeToolEvent,
  host: AppToolHost,
  port: ToolPort,
  listeners: Set<AppToolBridgeListener>,
): void {
  if (event.type === "cancel") {
    record.cancelled.add(event.invocationId);
    record.calls.get(event.invocationId)?.abort.abort();
    return;
  }
  if (record.seen.has(event.invocationId)) {
    failure(record, new Error("Application tool identity was reused"));
    return;
  }
  record.seen.add(event.invocationId);
  const abort = new AbortController();
  if (record.cancelled.delete(event.invocationId)) abort.abort();
  const active = { abort, runId: event.turnId, done: Promise.resolve() };
  // Reserve before callbacks/approval observers can run synchronously.
  record.calls.set(event.invocationId, active);
  active.done = port
    .work(`Running ${event.name}`, async () => {
      let outcome: Outcome = { type: "rejected" };
      try {
        if (record.closing || event.turnId !== record.turnId || record.failed)
          return;
        await emit(listeners, record, {
          type: "tool.start",
          id: event.invocationId,
          name: event.name,
          server: "lapis-tools",
          input: event.arguments,
        });
        const result = await host.invoke(
          record.bindingId,
          {
            runId: event.turnId,
            toolCallId: event.invocationId,
            name: event.name,
            input: event.arguments,
          },
          abort.signal,
        );
        await emit(listeners, record, {
          type: "tool.end",
          id: event.invocationId,
          name: event.name,
          server: "lapis-tools",
          output: result,
        });
        outcome = { type: "completed", value: result };
      } catch (error) {
        const known = error instanceof AppToolExecutionError && !error.outcome;
        if (!known)
          failure(
            record,
            new Error(
              "Application tool outcome is unknown; do not replay automatically.",
            ),
          );
        const code = known ? error.code : "outcome_unknown";
        const message = known ? error.message : record.failed!.message;
        outcome = {
          type: known
            ? code === "invalid_arguments"
              ? "invalid"
              : "rejected"
            : "unknown",
        };
        try {
          await emit(listeners, record, {
            type: "tool.end",
            id: event.invocationId,
            name: event.name,
            server: "lapis-tools",
            error: { code, message },
          });
        } catch (persistError) {
          failure(record, persistError);
          outcome = { type: "unknown" };
        }
      } finally {
        // Never acknowledge actual execution drain while an aborted callback runs.
        await host.settleInvocation(record.bindingId, event.invocationId);
        record.replies.set(event.invocationId, outcome);
        try {
          await port.request(record.bridgeId, {
            type: "reply",
            invocationId: event.invocationId,
            outcome,
          });
          record.replies.delete(event.invocationId);
        } catch (error) {
          failure(record, error);
          reportFailure(record, port);
        }
      }
      if (record.failed) throw record.failed;
    })
    .catch((error) => {
      failure(record, error);
      reportFailure(record, port);
    })
    .finally(() => record.calls.delete(event.invocationId));
}
