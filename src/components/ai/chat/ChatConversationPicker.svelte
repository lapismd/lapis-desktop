<script lang="ts">
  import type { ChatPanelActions } from "../../../lib/ai/chat/panel/actions.ts";
  // SPDX-License-Identifier: Apache-2.0
  // Retained Lapis chat presentation; see src/lib/ai/NOTICE.md.
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import { revealConversationScope } from "../../../lib/ai/conversations/reveal-scope.ts";
  import type { ConversationsState } from "../../../lib/ai/chat/panel/conversations.svelte.ts";
  import type { AiChatController } from "../../../lib/ai/chat/chat-controller.svelte.ts";
  import type { AiChatPanelProps } from "../../../lib/ai/chat/panel/props.ts";

  let {
    panelProps,
    controller,
    actions,
    conversationsState,
  }: {
    panelProps: AiChatPanelProps;
    controller: AiChatController;
    actions: ChatPanelActions;
    conversationsState: ConversationsState;
  } = $props();
  const app = $derived(panelProps.app);
</script>

{#if conversationsState.showPicker}
  <div
    class="ai-chat-panel__conversation-picker"
    data-testid="ai-chat-conversation-picker"
  >
    <CommandView.Root>
      <CommandView.Input placeholder="Search conversations" />
      <CommandView.List aria-label="Conversations in this folder">
        <CommandView.Empty>No conversations</CommandView.Empty>
        {#each conversationsState.pickerGroups as group (group.heading)}
          <CommandView.Group heading={group.heading}>
            {#each group.items as entry (`${entry.location.scopeDir}:${entry.location.conversationId}`)}
              <CommandView.Item
                value={`${entry.metadata?.title ?? "Untitled"} ${entry.location.scopeDir} ${entry.location.conversationId}`}
                onSelect={() => {
                  revealConversationScope(app, entry.location.scopeDir);
                  void actions.perform(() =>
                    controller.openConversation(entry.location),
                  );
                }}
              >
                <CommandView.ItemLabel>
                  {entry.metadata?.title ?? "Untitled"}
                </CommandView.ItemLabel>
                {#if entry.preview}
                  <CommandView.ItemDescription>
                    {entry.preview}
                  </CommandView.ItemDescription>
                {/if}
              </CommandView.Item>
            {/each}
          </CommandView.Group>
        {/each}
      </CommandView.List>
    </CommandView.Root>
  </div>
{/if}
