<script lang="ts">
  // SPDX-License-Identifier: Apache-2.0
  // Retained Lapis chat presentation; see src/lib/ai/NOTICE.md.
  import { untrack } from "svelte";
  import * as Chat from "@lapismd/design-core/ai/chat";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import SparklesIcon from "@lucide/svelte/icons/sparkles";
  import type { AiChatPanelProps } from "../../../lib/ai/chat/panel/props.ts";
  import { createChatPanelController } from "../../../lib/ai/chat/panel/create-controller.ts";
  import { createComposerState } from "../../../lib/ai/chat/panel/composer.svelte.ts";
  import { createAttachmentsState } from "../../../lib/ai/chat/panel/attachments.svelte.ts";
  import { createConversationsState } from "../../../lib/ai/chat/panel/conversations.svelte.ts";
  import { createChatPanelActions } from "../../../lib/ai/chat/panel/actions.ts";
  import { observeChatPanel } from "../../../lib/ai/chat/panel/lifecycle.svelte.ts";
  import ChatScopeFooter from "./ChatScopeFooter.svelte";
  import ChatComposer from "./ChatComposer.svelte";
  import ChatTimeline from "./ChatTimeline.svelte";
  import AiTranscriptPanel from "./AiTranscriptPanel.svelte";
  import ImportedConversation from "../imports/ImportedConversation.svelte";
  import "./panel.css";

  const panelProps: AiChatPanelProps = $props();
  const controller = untrack(() =>
    createChatPanelController(panelProps, (next) =>
      composerState.acceptDefaults(next),
    ),
  );
  const composerState = createComposerState(() => panelProps, controller);
  const attachmentsState = createAttachmentsState(() => panelProps, controller);
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
  data-model-catalog-loading={composerState.catalogState?.loading ?? false}
>
  {#if imported}
    <ImportedConversation snapshot={imported} />
  {:else if panelProps.presentation === "transcript"}
    <AiTranscriptPanel
      {panelProps}
      {controller}
      {composerState}
      {attachmentsState}
      {conversationsState}
      {actions}
    />
  {:else}<Chat.Layout
      density="compact"
      isEmpty={conversationsState.isEmpty}
      aria-label="AI chat"
    >
      {#snippet emptyState()}
        <Empty.Root
          ><Empty.Header
            ><Empty.Media variant="icon"
              ><SparklesIcon aria-hidden="true" /></Empty.Media
            >
            <Empty.Title>Start a conversation</Empty.Title><Empty.Description
              >Ask a question or describe the change you want to make.</Empty.Description
            >
          </Empty.Header></Empty.Root
        >
        <ChatScopeFooter
          {panelProps}
          {controller}
          {conversationsState}
          {actions}
        />
      {/snippet}
      {#snippet composer()}
        <ChatComposer
          {panelProps}
          {controller}
          {composerState}
          {attachmentsState}
          {actions}
        />
      {/snippet}
      <ChatTimeline {panelProps} {controller} {conversationsState} {actions} />
    </Chat.Layout>{/if}
</div>
