<script lang="ts">
  // SPDX-License-Identifier: Apache-2.0
  // Retained Lapis chat presentation; see src/lib/ai/NOTICE.md.
  import { untrack } from "svelte";
  import type { AiChatPanelProps } from "../../../lib/ai/chat/panel/props.ts";
  import { createChatPanelController } from "../../../lib/ai/chat/panel/create-controller.ts";
  import { createComposerState } from "../../../lib/ai/chat/panel/composer.svelte.ts";
  import { createAttachmentsState } from "../../../lib/ai/chat/panel/attachments.svelte.ts";
  import { createConversationsState } from "../../../lib/ai/chat/panel/conversations.svelte.ts";
  import { createChatPanelActions } from "../../../lib/ai/chat/panel/actions.ts";
  import { observeChatPanel } from "../../../lib/ai/chat/panel/lifecycle.svelte.ts";
  import DesktopAgentChat from "../shared/DesktopAgentChat.svelte";
  import ImportedConversation from "../imports/ImportedConversation.svelte";
  import { observeConversationDraft } from "../../../lib/ai/chat/panel/drafts.svelte.ts";
  import "./panel.css";

  const panelProps: AiChatPanelProps = $props();
  const controller = untrack(() =>
    createChatPanelController(
      panelProps,
      (next) => composerState.acceptDefaults(next),
      (location) => composerState.adoptDraft(location),
    ),
  );
  const composerState = createComposerState(() => panelProps, controller);
  const attachmentsState = createAttachmentsState(() => panelProps, controller);
  observeConversationDraft(
    () => panelProps,
    controller,
    composerState,
    attachmentsState,
  );
  const conversationsState = createConversationsState(
    () => panelProps,
    controller,
  );
  const actions = createChatPanelActions(
    () => panelProps,
    controller,
    composerState,
    attachmentsState,
  );
  observeChatPanel(
    () => panelProps,
    controller,
    conversationsState,
    actions.perform,
  );
  const imported = $derived(
    panelProps.recordedImport ?? controller.importedSnapshot,
  );
</script>

<div
  class="ai-chat-panel"
  data-ui-component="ai-chat-panel"
  data-testid="ai-chat-panel"
  data-initializing={panelProps.initializing ?? false}
  data-draft-ready={composerState.draftReady}
  data-model-catalog-loading={composerState.catalogState?.loading ?? false}
>
  {#if imported}
    <ImportedConversation
      snapshot={imported}
      app={panelProps.app}
      repository={panelProps.repository}
      onDispose={panelProps.onControllerDispose}
      onLocationChange={panelProps.onConversationLocationChange}
    />
  {:else}
    <DesktopAgentChat
      {panelProps}
      {controller}
      {composerState}
      {attachmentsState}
      {conversationsState}
      {actions}
    />
  {/if}
</div>
