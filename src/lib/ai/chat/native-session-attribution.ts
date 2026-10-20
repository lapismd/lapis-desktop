import type { TranscriptItem } from "@lapismd/design-core/chat";
import type { NativeCaptureFacts } from "../conversations/native-capture-facts.ts";
import type { NativeRecordRef } from "../conversations/native-records.ts";
import {
  NativeSessionRecords,
  nativeRecordKey,
} from "../conversations/native-session-records.ts";
import type { AgentRecipientOption } from "../conversations/recipients.ts";
import { agentAvatar } from "../presentation/agent-avatar.ts";

/** Typed native application facts only; raw evidence text remains inert. */
export function nativeSessionAttribution(
  records: NativeSessionRecords,
  eventEvidence: Iterable<NativeRecordRef>,
  profiles: readonly AgentRecipientOption[],
) {
  const facts = new Map<string, NativeCaptureFacts>();
  const requests = new Map<string, string>();
  let source: string | undefined, selected: NativeCaptureFacts | undefined;
  for (const ref of [...records.source.evidence, ...eventEvidence]) {
    const record = records.record(ref);
    const value =
      record?.projection.type === "observation_batch"
        ? record.projection.value.desktop
        : undefined;
    if (!value) continue;
    const signature = JSON.stringify([
      value.repository,
      value.threadId,
      value.worker,
      value.clientId,
      value.participant,
    ]);
    if (source !== undefined && source !== signature)
      throw new Error(
        "Native session attribution has conflicting retained values",
      );
    source = signature;
    selected = value;
    if (value.authored) {
      const proof = JSON.stringify(value.authored),
        prior = requests.get(value.authored.requestId);
      if (prior !== undefined && prior !== proof)
        throw new Error(
          "Native prompt correspondence has conflicting retained values",
        );
      requests.set(value.authored.requestId, proof);
    }
    facts.set(nativeRecordKey(ref), value);
  }
  let assistant: TranscriptItem["author"];
  if (selected) {
    const participant = selected.participant;
    const profile = participant
      ? profiles.find((v) => v.id === participant.profileId)
      : undefined;
    assistant = {
      id: records.source.sessionId,
      name: participant?.label ?? "Codex",
      image: profile?.avatar ?? agentAvatar("codex"),
      background: profile?.avatarBackground,
      shape: "rounded",
    };
  }
  return {
    assistant,
    authored: (ref: NativeRecordRef | undefined) =>
      ref
        ? (facts.get(nativeRecordKey(ref))?.authored ?? undefined)
        : undefined,
  };
}
