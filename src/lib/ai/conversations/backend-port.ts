import type {
  NativeRecordPage,
  NativeSessionRecordSource,
} from "./native-records.ts";
import type { NativeConversationView } from "./native-view.ts";

/** Native storage selection is separate from presentation and provider sessions. */
export type ConversationBackend = "vault-files" | "jj";
export interface BackendSelection {
  backend: ConversationBackend;
  revision: number;
}
export interface BackendSelectionReceipt {
  request_id: string;
  expected_revision: number;
  selection: BackendSelection;
}
export interface OpenedConversationBackend {
  handle: string;
  selection: BackendSelection;
}
export interface PreparedConversation {
  requestId: string;
  conversationId: string;
  threadId: string;
  repository: string | null;
  /** Opaque native proof; absent proof remains unknown. Never parse into JS numbers. */
  receipt: string | null;
}
export interface ConversationRead {
  handle: string;
  /** Native JSON preserves full-width integers for the projection decoder. */
  snapshot: string;
}
/** Calls never silently select another backend or automatically retry writes. */
export interface ConversationBackendPort {
  readonly dispatch: import("./dispatch-port.ts").NativeDispatchPort;
  readonly canonical: CanonicalConversationPort;
  readonly authored: AuthoredConversationPort;
  readonly managed: ManagedConversationPort;
  selection(): Promise<BackendSelection>;
  select(
    request: string,
    expectedRevision: number,
    backend: ConversationBackend,
  ): Promise<BackendSelectionReceipt | null>;
  selectionStatus(request: string): Promise<BackendSelectionReceipt | null>;
  open(request: string): Promise<OpenedConversationBackend>;
  prepare(
    handle: string,
    request: string,
    title: string,
  ): Promise<PreparedConversation>;
  preparationStatus(
    handle: string,
    request: string,
  ): Promise<PreparedConversation | null>;
  openRead(handle: string, request: string): Promise<ConversationRead | null>;
  readTranscript(
    handle: string,
    readHandle: string,
    cursor: string,
    afterSequence: string,
  ): Promise<string>;
  closeRead(handle: string, readHandle: string): Promise<void>;
  readRecords(
    handle: string,
    readHandle: string,
    cursor: string,
    afterIndex: number,
  ): Promise<NativeRecordPage>;
  close(handle: string): Promise<void>;
}

/** Exact native identities are not portable UUID file locations. */
export type CanonicalConversationTarget =
  | { type: "conversation"; id: string }
  | { type: "recorded"; session: string };
export type CanonicalConversationIdentity = {
  target: CanonicalConversationTarget;
  threadId: string;
  repository: string | null;
};
export type CanonicalConversationRead = ConversationRead & {
  identity: CanonicalConversationIdentity;
  selection: number[];
  recordSources: NativeSessionRecordSource[];
  view: NativeConversationView;
};
export type CanonicalConversationSummary = CanonicalConversationIdentity & {
  title: string;
  status: "created" | "active" | "idle" | "archived";
  createdAtMillis: bigint;
  updatedAtMillis: bigint;
};
export type CanonicalConversationPage = {
  version: 1;
  repository: string | null;
  selection: number[];
  conversations: CanonicalConversationSummary[];
  nextCursor: string | null;
};
export type CanonicalConversationEdit = {
  requestId: string;
  threadId: string;
  expectedSelection: readonly number[];
  action:
    | { type: "rename"; title: string | null }
    | {
        type: "lifecycle";
        action: "activate" | "idle" | "archive" | "tombstone" | "restore";
      };
};
export type CanonicalConversationEditWrite = {
  requestId: string;
  conversation: CanonicalConversationIdentity;
  receipt: string | null;
};
export interface CanonicalConversationPort {
  list(
    handle: string,
    cursor?: string | null,
  ): Promise<CanonicalConversationPage>;
  read(handle: string, threadId: string): Promise<string | null>;
  openRead(
    handle: string,
    threadId: string,
  ): Promise<CanonicalConversationRead | null>;
  edit(
    handle: string,
    edit: CanonicalConversationEdit,
  ): Promise<CanonicalConversationEditWrite>;
  editStatus(
    handle: string,
    requestId: string,
    threadId: string,
  ): Promise<CanonicalConversationEditWrite | null>;
}
export type AuthoredConversationWrite = {
  requestId: string;
  conversationRequestId: string;
  messageId: string;
  receipt: string | null;
};
export type CanonicalAuthoredMessage = {
  requestId: string;
  threadId: string;
  expectedSelection: readonly number[];
  text: string;
};
export type CanonicalAuthoredWrite = {
  requestId: string;
  conversation: CanonicalConversationIdentity;
  messageId: string;
  receipt: string | null;
};
export interface AuthoredConversationPort {
  appendCanonical(
    handle: string,
    message: CanonicalAuthoredMessage,
  ): Promise<CanonicalAuthoredWrite>;
  canonicalStatus(
    handle: string,
    requestId: string,
    threadId: string,
  ): Promise<CanonicalAuthoredWrite | null>;
  append(
    handle: string,
    requestId: string,
    conversationRequestId: string,
    text: string,
  ): Promise<AuthoredConversationWrite>;
  status(
    handle: string,
    requestId: string,
    conversationRequestId: string,
  ): Promise<AuthoredConversationWrite | null>;
}

export type CanonicalCapturePreparation = {
  dispatchRequestId?: string;
  requestId: string;
  conversation: CanonicalConversationIdentity;
  expectedSelection: readonly number[];
  clientId: "codex";
  participant?: import("./native-capture-facts.ts").NativeCaptureParticipant;
};
export type PreparedCanonicalCapture = {
  requestId: string;
  conversation: CanonicalConversationIdentity;
  /** One-use native launch target; never a conversation or provider session ID. */
  targetId: string;
};
export interface ManagedConversationPort {
  prepareCanonical(
    handle: string,
    input: CanonicalCapturePreparation,
  ): Promise<PreparedCanonicalCapture>;
}
