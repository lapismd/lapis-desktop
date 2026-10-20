import type {
  NativeCaptureFacts,
  NativeCaptureParticipant,
} from "../../../ai/conversations/native-capture-facts.ts";
import { choice, fields, label, nullable, schema } from "./record-fields.ts";
import { collabRef } from "./view-fields.ts";
import * as wire from "./wire.ts";

export function participant(value: unknown): NativeCaptureParticipant {
  const v = fields(value, [
    "profileId",
    "label",
    "preferredModel",
    "preferredEffort",
  ]);
  const profileId = label(v.profileId, 256),
    name = label(v.label, 320);
  const preferredModel = nullable(v.preferredModel, (v) => label(v, 256));
  if (
    profileId.length > 64 ||
    [...name].length > 80 ||
    /[\u2028\u2029]/u.test(profileId + name + (preferredModel ?? ""))
  )
    return wire.invalid();
  return {
    profileId,
    label: name,
    preferredModel,
    preferredEffort: nullable(v.preferredEffort, (v) =>
      choice(v, ["off", "low", "medium", "high"] as const),
    ),
  };
}
export function captureFacts(value: unknown): NativeCaptureFacts {
  const v = fields(value, [
    "schema",
    "repository",
    "threadId",
    "worker",
    "requestId",
    "clientId",
    "participant",
    "authored",
  ]);
  const requestId = nullable(v.requestId, (v) => label(v, 256));
  const authored = nullable(v.authored, (value) => {
    const a = fields(value, [
      "requestId",
      "messageId",
      "revision",
      "threadVersion",
      "actor",
    ]);
    if (
      requestId === null ||
      wire.handle(requestId).replaceAll("-", "") !== wire.id(a.requestId)
    )
      return wire.invalid();
    return {
      requestId: wire.id(a.requestId),
      messageId: wire.id(a.messageId),
      revision: collabRef(a.revision, "human_message_revision"),
      threadVersion: collabRef(a.threadVersion, "thread_version"),
      actor: wire.id(a.actor),
    };
  });
  return {
    schema: schema(v.schema),
    repository: wire.id(v.repository),
    threadId: wire.id(v.threadId),
    worker: label(v.worker, 256),
    requestId,
    clientId: choice(v.clientId, ["codex"] as const),
    participant: nullable(v.participant, participant),
    authored,
  };
}
