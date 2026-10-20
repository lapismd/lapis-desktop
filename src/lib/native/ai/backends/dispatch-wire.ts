import type {
  NativeDispatchInput,
  NativeDispatchView,
} from "../../../ai/conversations/dispatch-port.ts";
import { identity } from "./canonical-wire.ts";
import { participant } from "./capture-facts.ts";
import {
  choice,
  fields,
  label,
  list,
  nullable,
  unique,
} from "./record-fields.ts";
import { boolean, collabRef } from "./view-fields.ts";
import * as wire from "./wire.ts";

export function dispatchInput(input: NativeDispatchInput): NativeDispatchInput {
  const recipients = unique(
    list(input.recipients, 4, (value) => {
      const v = fields(value, ["requestId", "participant"]);
      return {
        requestId: wire.id(v.requestId),
        participant: nullable(v.participant, participant),
      };
    }),
    (r) => r.requestId,
  );
  const expectedSelection = wire.byteSelection(input.expectedSelection);
  if (
    !recipients.length ||
    !expectedSelection.length ||
    recipients.some((r) => r.requestId === input.requestId)
  )
    return wire.invalid();
  unique(recipients, (r) => r.participant?.profileId ?? "codex");
  return {
    requestId: wire.id(input.requestId),
    threadId: wire.id(input.threadId),
    expectedSelection,
    authored: boolean(input.authored),
    recipients,
  };
}
export function dispatchView(
  value: unknown,
  threadId: string,
  requestId?: string,
): NativeDispatchView | null {
  if (value === null) return null;
  const v = fields(value, [
    "requestId",
    "conversation",
    "authored",
    "recipients",
    "stopRequested",
    "stopped",
    "settled",
    "fresh",
  ]);
  const request = wire.id(v.requestId),
    conversation = identity(v.conversation);
  if (
    (requestId !== undefined && request !== requestId) ||
    conversation.threadId !== threadId ||
    conversation.repository === null
  )
    return wire.invalid();
  const authored = nullable(v.authored, (value) => {
    const a = fields(value, [
      "requestId",
      "messageId",
      "revision",
      "threadVersion",
      "actor",
    ]);
    if (wire.id(a.requestId) !== request) return wire.invalid();
    return {
      requestId: request,
      messageId: wire.id(a.messageId),
      actor: wire.id(a.actor),
      revision: collabRef(a.revision, "human_message_revision"),
      threadVersion: collabRef(a.threadVersion, "thread_version"),
    };
  });
  const recipients = unique(
    list(v.recipients, 4, (value) => {
      const r = fields(value, [
        "requestId",
        "participant",
        "phase",
        "targetId",
        "binding",
        "prepared",
      ]);
      const phase = choice(r.phase, [
        "planned",
        "reserved",
        "bound",
        "prepared",
        "completed",
        "rejected",
        "unknown",
      ] as const);
      const targetId = nullable(r.targetId, wire.handle);
      const binding = nullable(r.binding, (value) => {
        const b = fields(value, ["worker", "openRequest", "target"]);
        return {
          worker: label(b.worker, 256),
          openRequest: label(b.openRequest, 256),
          target: wire.handle(b.target),
        };
      });
      const prepared = boolean(r.prepared);
      if (
        (phase === "planned") !== (targetId === null) ||
        ["bound", "prepared", "completed", "rejected", "unknown"].includes(
          phase,
        ) !==
          (binding !== null) ||
        ["prepared", "completed", "rejected", "unknown"].includes(phase) !==
          prepared ||
        (binding && binding.target !== targetId)
      )
        return wire.invalid();
      return {
        requestId: wire.id(r.requestId),
        participant: nullable(r.participant, participant),
        phase,
        targetId,
        binding,
        prepared,
      };
    }),
    (r) => r.requestId,
  );
  if (!recipients.length || recipients.some((r) => r.requestId === request))
    return wire.invalid();
  unique(recipients, (r) => r.participant?.profileId ?? "codex");
  unique(
    recipients.filter((r) => r.targetId !== null),
    (r) => r.targetId!,
  );
  unique(
    recipients.filter((r) => r.binding !== null),
    (r) => r.binding!.worker,
  );
  const stopRequested = boolean(v.stopRequested),
    stopped = boolean(v.stopped),
    settled = boolean(v.settled),
    fresh = boolean(v.fresh);
  if (
    (stopped && !stopRequested) ||
    settled !==
      (stopped ||
        recipients.every(
          (r) => r.phase === "completed" || r.phase === "rejected",
        )) ||
    (fresh && (stopRequested || recipients.some((r) => r.phase !== "planned")))
  )
    return wire.invalid();
  return {
    requestId: request,
    conversation,
    authored,
    recipients,
    stopRequested,
    stopped,
    settled,
    fresh,
  };
}
