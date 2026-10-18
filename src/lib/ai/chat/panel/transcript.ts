import type { AiChatPanelProps } from "./props.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
import type { ComposerState } from "./composer.svelte.ts";
import type { AttachmentsState } from "./attachments.svelte.ts";
import type { ConversationsState } from "./conversations.svelte.ts";
import type { ChatPanelActions } from "./actions.ts";

export type TranscriptPanelProps = {
  panelProps: AiChatPanelProps;
  controller: AiChatController;
  composerState: ComposerState;
  attachmentsState: AttachmentsState;
  conversationsState: ConversationsState;
  actions: ChatPanelActions;
};
