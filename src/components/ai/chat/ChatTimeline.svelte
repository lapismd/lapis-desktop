<script lang="ts">
  // SPDX-License-Identifier: Apache-2.0
  // Retained Lapis chat presentation; see src/lib/ai/NOTICE.md.
  import type { Snippet } from "svelte";
  import type { AiChatToolItem } from "../../../lib/ai/chat/chat-tool-display.ts";
  import { MarkdownEmbed } from "@lapis-notes/markdown/embed";
  import * as Chat from "@lapismd/design-core/ai/chat";
  import { Reasoning } from "@lapismd/design-core/ai/experimental";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import CopyIcon from "@lucide/svelte/icons/copy";
  import RedoIcon from "@lucide/svelte/icons/redo-2";
  import { mentionTokensFromText } from "../../../lib/ai/chat/chat-mentions.ts";
  import { isSlashCommandNotice } from "../../../lib/ai/chat/chat-items.ts";
  import {
    parseToolResultPayload,
    resolveToolResultView,
  } from "../../../lib/ai/chat/chat-result-views.ts";
  import {
    formatChatTimestamp,
    groupChatItemsByDate,
  } from "../../../lib/ai/chat/chat-time.ts";
  import { bindingLabels } from "../../../lib/ai/chat/panel/binding-labels.ts";
  import type { ConversationsState } from "../../../lib/ai/chat/panel/conversations.svelte.ts";
  import type { ChatPanelActions } from "../../../lib/ai/chat/panel/actions.ts";
  import AiInventoryResult from "./AiInventoryResult.svelte";
  import ChatConversationPicker from "./ChatConversationPicker.svelte";
  import ChatScopeFooter from "./ChatScopeFooter.svelte";
  import type { AiChatController } from "../../../lib/ai/chat/chat-controller.svelte.ts";
  import type { AiChatPanelProps } from "../../../lib/ai/chat/panel/props.ts";

  let {
    panelProps,
    controller,
    conversationsState,
    actions,
  }: {
    panelProps: AiChatPanelProps;
    controller: AiChatController;
    conversationsState: ConversationsState;
    actions: ChatPanelActions;
  } = $props();
  const app = $derived(panelProps.app);
  const initializing = $derived(panelProps.initializing ?? false);
  const latestMessageId = $derived(controller.items.at(-1)?.id);
  const timeline = $derived(
    groupChatItemsByDate(
      controller.items,
      new Date(),
      bindingLabels(controller.bindings),
    ),
  );
  const resultConversation = $derived({
    conversationId: controller.location?.conversationId,
    scopeDirectory: controller.location?.scopeDir,
  });
  function toolCalls(
    items: AiChatToolItem[],
    detail: Snippet<[Chat.ToolCallItem]>,
  ): Chat.ToolCallItem[] {
    return items.map<Chat.ToolCallItem>((item) => ({
      ...actions.toolCallProps(item),
      detail: item.input || item.output ? detail : undefined,
    }));
  }
</script>

{#snippet toolDetail(call: Chat.ToolCallItem)}
  {@const detail = call.data as
    | { input?: string; output?: string; error?: string; name?: string }
    | undefined}
  {@const ResultView = resolveToolResultView(app, detail?.name ?? call.name)}
  {@const parsedOutput = parseToolResultPayload(detail?.output)}
  {#if ResultView && app && parsedOutput != null && !detail?.error}
    <ResultView
      {app}
      conversation={resultConversation}
      name={detail?.name ?? call.name ?? ""}
      input={parseToolResultPayload(detail?.input)}
      output={parsedOutput}
      state="completed"
    />
  {:else}
    <Chat.ToolCallDetail
      input={detail?.input}
      output={detail?.output}
      error={detail?.error}
      toolName={detail?.name ?? call.name}
    />
  {/if}
{/snippet}

<Chat.MessageList
  density="compact"
  {latestMessageId}
  isStreaming={controller.busy}
  isEmpty={conversationsState.isEmpty}
>
  <ChatConversationPicker
    {panelProps}
    {controller}
    {conversationsState}
    {actions}
  />
  {#each timeline as entry (entry.kind === "item" ? entry.item.id : entry.id)}
    {#if entry.kind === "divider"}
      <Chat.SystemMessage variant="divider">{entry.label}</Chat.SystemMessage>
    {:else if entry.kind === "tools"}
      <Chat.ToolCalls
        calls={toolCalls(entry.items, toolDetail)}
        defaultExpanded={false}
      />
    {:else if entry.item.type === "message"}
      {@const message = entry.item}
      <Chat.Message sender={message.role === "user" ? "user" : "assistant"}>
        <Chat.MessageBubble>
          {#if message.role === "assistant" && app}
            <MarkdownEmbed
              {app}
              value={message.text}
              htmlPolicy="safe"
              class="ai-chat-panel__markdown"
            />
          {:else}
            <Chat.TokenizedText
              text={message.text}
              tokens={mentionTokensFromText(message.text)}
            />
          {/if}
        </Chat.MessageBubble>
        {#snippet metadata()}
          {#if message.role === "assistant"}
            <Chat.MessageMetadata
              timestamp={message.createdAt
                ? formatChatTimestamp(message.createdAt)
                : undefined}
            >
              {#snippet footer()}
                <span class="ai-chat-panel__message-actions">
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-label="Copy response"
                    onclick={() => void actions.copyResponse(message.text)}
                  >
                    <CopyIcon aria-hidden="true" />
                  </Button>
                </span>
              {/snippet}
            </Chat.MessageMetadata>
          {:else if message.createdAt}
            <Chat.MessageMetadata
              timestamp={formatChatTimestamp(message.createdAt)}
            />
          {/if}
        {/snippet}
      </Chat.Message>
    {:else if entry.item.type === "thinking"}
      <Reasoning
        streaming={entry.item.state === "streaming"}
        preview={entry.item.text}
        expanded={entry.item.state === "streaming"}
      >
        {entry.item.text}
      </Reasoning>
    {:else if entry.item.type === "approval"}
      {#if entry.item.status !== "pending"}
        <Chat.SystemMessage>
          Approval {entry.item.status}
          {entry.item.responseOptionId
            ? ` (${entry.item.responseOptionId})`
            : ""}
        </Chat.SystemMessage>
      {/if}
    {:else if entry.item.type === "question"}
      {#if entry.item.status !== "pending"}
        <Chat.SystemMessage>
          Question {entry.item.status}
        </Chat.SystemMessage>
      {/if}
    {:else if entry.item.type === "error"}
      {@const errorItem = entry.item}
      {@const retryPrompt = actions.promptForError(errorItem.id)}
      <Chat.Message sender="assistant">
        <Chat.MessageBubble>{errorItem.text}</Chat.MessageBubble>
        {#snippet metadata()}
          <Chat.MessageMetadata
            timestamp={errorItem.createdAt
              ? formatChatTimestamp(errorItem.createdAt)
              : undefined}
            status="error"
          >
            {#snippet footer()}
              <span class="ai-chat-panel__message-actions">
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Retry message"
                  disabled={initializing || controller.busy || !retryPrompt}
                  onclick={() =>
                    retryPrompt && void actions.submit(retryPrompt)}
                >
                  <RedoIcon aria-hidden="true" />
                </Button>
              </span>
            {/snippet}
          </Chat.MessageMetadata>
        {/snippet}
      </Chat.Message>
    {:else if entry.item.type === "status" && entry.item.layout === "inventory"}
      <div
        class="ai-chat-panel__command-notice"
        data-testid="ai-chat-command-notice"
        data-layout="inventory"
        role="status"
      >
        <AiInventoryResult
          {app}
          conversation={resultConversation}
          name={entry.item.inventory?.kind ?? "skills"}
          output={entry.item.inventory}
        />
      </div>
    {:else if entry.item.type === "status" && isSlashCommandNotice(entry.item)}
      <div
        class="ai-chat-panel__command-notice"
        data-testid="ai-chat-command-notice"
        role="status"
      >
        {entry.item.text}
      </div>
    {:else}
      <Chat.SystemMessage>{entry.item.text}</Chat.SystemMessage>
    {/if}
  {/each}
  <ChatScopeFooter {panelProps} {controller} {conversationsState} {actions} />
</Chat.MessageList>
