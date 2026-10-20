import { vi } from "vitest";
import type {
  CanonicalConversationIdentity,
  ConversationBackendPort,
} from "../../../src/lib/ai/conversations/backend-port.ts";
import type { NativeDispatchView } from "../../../src/lib/ai/conversations/dispatch-port.ts";

/** Synthetic native facts only; never evidence of provider/capture success. */
export function managedDispatchFixture(
  port: ConversationBackendPort,
  conversation: CanonicalConversationIdentity,
  order: string[],
) {
  let view: NativeDispatchView | undefined;
  const begin = vi
    .spyOn(port.dispatch, "begin")
    .mockImplementation(async (_handle, input) => {
      order.push("begin-dispatch");
      view = {
        requestId: input.requestId,
        conversation: structuredClone(conversation),
        authored: input.authored
          ? {
              requestId: input.requestId,
              messageId: "f".repeat(32),
              actor: "a".repeat(32),
              revision: { kind: "human_message_revision", id: "b".repeat(64) },
              threadVersion: { kind: "thread_version", id: "c".repeat(64) },
            }
          : null,
        recipients: input.recipients.map((r) => ({
          ...r,
          phase: "planned",
          targetId: null,
          binding: null,
          prepared: false,
        })),
        stopRequested: false,
        stopped: false,
        settled: false,
        fresh: true,
      };
      return structuredClone(view);
    });
  const status = vi
    .spyOn(port.dispatch, "status")
    .mockImplementation(async () => {
      order.push("dispatch-status");
      return view ? { ...structuredClone(view), fresh: false } : null;
    });
  const fence = vi
    .spyOn(port.dispatch, "fence")
    .mockImplementation(async () => {
      order.push("fence-dispatch");
      if (!view) throw new Error("Native dispatch fence outcome unknown");
      view = { ...view, fresh: false, stopRequested: true };
      return structuredClone(view);
    });
  const stop = vi.spyOn(port.dispatch, "stop").mockImplementation(async () => {
    order.push("stop-dispatch");
    if (!view) throw new Error("Native dispatch stop outcome unknown");
    view = {
      ...view,
      fresh: false,
      stopRequested: true,
      stopped: true,
      settled: true,
    };
    return structuredClone(view);
  });
  return {
    begin,
    status,
    stop,
    fence,
    view: () => structuredClone(view!),
    reserve(requestId: string, target: string) {
      const recipient = view!.recipients.find(
        (r) => r.requestId === requestId,
      )!;
      recipient.targetId = target;
      recipient.phase = "reserved";
    },
    bind(requestId: string, worker: string) {
      const r = view!.recipients.find((r) => r.requestId === requestId)!;
      r.binding = { worker, openRequest: "native-open", target: r.targetId! };
      r.phase = "bound";
    },
    complete(index: number) {
      const r = view!.recipients[index]!;
      r.phase = "completed";
      r.prepared = true;
      view!.settled = view!.recipients.every((r) => r.phase === "completed");
    },
  };
}
