import type { AgentRequest, AgentSession } from "../core/runtime.ts";
import type {
  CanonicalAuthoredWrite,
  CanonicalConversationIdentity,
  ConversationBackendPort,
  PreparedCanonicalCapture,
} from "./backend-port.ts";
import type { NativeCaptureParticipant } from "./native-capture-facts.ts";
import type { NativeDispatchView } from "./dispatch-port.ts";

export interface ManagedAgentLauncher {
  supports(request: AgentRequest): Promise<boolean>;
  start(
    prepared: PreparedCanonicalCapture,
    request: AgentRequest,
  ): Promise<AgentSession>;
  /** Detach local streams after the native fence and before native closure. */
  prepareStop(session: AgentSession): Promise<void>;
  /** Release renderer streams after native Stop has closed the exact workers. */
  releaseStopped(session: AgentSession): Promise<void>;
}
export type ManagedTurnRecipient = {
  participant?: NativeCaptureParticipant;
  request: Omit<AgentRequest, "prompt" | "recipients" | "deliveryTargets">;
};
export type ManagedDeliveryState = {
  id: string;
  participant?: NativeCaptureParticipant;
  phase:
    | "pending"
    | "prepared"
    | "starting"
    | "running"
    | "completed"
    | "rejected"
    | "unknown";
  preparation?: PreparedCanonicalCapture;
  sessionId?: string;
  error?: string;
};
export type ManagedTurnState = {
  requestId: string;
  nativeRequestId: string;
  conversation: CanonicalConversationIdentity;
  phase:
    | "idle"
    | "preparing"
    | "ready"
    | "running"
    | "completed"
    | "failed"
    | "closed";
  authorship: "not-required" | "pending" | "confirmed" | "unknown";
  authored?: CanonicalAuthoredWrite;
  dispatch?: NativeDispatchView;
  cancellationRequested: boolean;
  deliveries: ManagedDeliveryState[];
  error?: string;
};
export type ManagedTurnPort = Pick<
  ConversationBackendPort,
  "authored" | "managed" | "canonical" | "closeRead" | "dispatch"
>;
