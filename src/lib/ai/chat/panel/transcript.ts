import type { AiChatPanelProps } from "./props.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
import type { ComposerState } from "./composer.svelte.ts";
import type { AttachmentsState } from "./attachments.svelte.ts";
import type { ConversationsState } from "./conversations.svelte.ts";
import type { ChatPanelActions } from "./actions.ts";
import type { Snippet } from "svelte";

/** Optional host composition around the existing mounted transcript and footer. */
export type TranscriptFrameProps = {
  panel: TranscriptPanelProps;
  view: "document" | "classic";
  onViewChange: (view: "document" | "classic") => void;
  children: Snippet;
  footer: Snippet;
  /** Optional body-covering tool inspector, rendered within the host shell. */
  toolInspector?: Snippet;
  bodySidebar?: Snippet<[number, boolean]>;
  bodySidebarOpen?: boolean;
  mainInspector?: Snippet;
};

export type TranscriptPanelProps = {
  panelProps: AiChatPanelProps;
  controller: AiChatController;
  composerState: ComposerState;
  attachmentsState: AttachmentsState;
  conversationsState: ConversationsState;
  actions: ChatPanelActions;
};
