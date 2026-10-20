import type { CanonicalConversationIdentity } from "./backend-port.ts";
import type {
  NativeAuthoredTurn,
  NativeCaptureParticipant,
} from "./native-capture-facts.ts";

/** Device-private execution intent. This is never a conversation transcript. */
export type NativeDispatchRecipient = {
  requestId: string;
  participant: NativeCaptureParticipant | null;
};
export type NativeDispatchInput = {
  requestId: string;
  threadId: string;
  expectedSelection: readonly number[];
  authored: boolean;
  recipients: NativeDispatchRecipient[];
};
export type NativeDispatchPhase =
  | "planned"
  | "reserved"
  | "bound"
  | "prepared"
  | "completed"
  | "rejected"
  | "unknown";
export type NativeDispatchView = {
  requestId: string;
  conversation: CanonicalConversationIdentity;
  authored: NativeAuthoredTurn | null;
  recipients: (NativeDispatchRecipient & {
    phase: NativeDispatchPhase;
    targetId: string | null;
    binding: { worker: string; openRequest: string; target: string } | null;
    prepared: boolean;
  })[];
  stopRequested: boolean;
  stopped: boolean;
  settled: boolean;
  /** False means retained state; it never authorizes another attempt. */
  fresh: boolean;
};
export interface NativeDispatchPort {
  begin(
    handle: string,
    input: NativeDispatchInput,
  ): Promise<NativeDispatchView>;
  status(
    handle: string,
    threadId: string,
    requestId?: string,
  ): Promise<NativeDispatchView | null>;
  /** Persist the Stop fence before renderer streams detach or workers close. */
  fence(
    handle: string,
    threadId: string,
    requestId: string,
  ): Promise<NativeDispatchView>;
  stop(
    handle: string,
    threadId: string,
    requestId: string,
  ): Promise<NativeDispatchView>;
}
