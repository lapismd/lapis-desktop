import type { NativeCollabRef } from "./native-view.ts";

/** Saved presentation preferences; these fields confer no execution authority. */
export type NativeCaptureParticipant = {
  profileId: string;
  label: string;
  preferredModel: string | null;
  preferredEffort: "off" | "low" | "medium" | "high" | null;
};
export type NativeAuthoredTurn = {
  requestId: string;
  messageId: string;
  revision: NativeCollabRef;
  threadVersion: NativeCollabRef;
  actor: string;
};
/** Native-confirmed preparation remains distinct from delivery or success. */
export type NativeCaptureFacts = {
  schema: 1;
  repository: string;
  threadId: string;
  worker: string;
  requestId: string | null;
  clientId: "codex";
  participant: NativeCaptureParticipant | null;
  authored: NativeAuthoredTurn | null;
};
