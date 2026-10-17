<script lang="ts">
  import type { ChatPanelActions } from "../../../lib/ai/chat/panel/actions.ts";
  // SPDX-License-Identifier: Apache-2.0
  // Retained Lapis chat presentation; see src/lib/ai/NOTICE.md.
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import ArchiveIcon from "@lucide/svelte/icons/archive";
  import ArchiveRestoreIcon from "@lucide/svelte/icons/archive-restore";
  import HistoryIcon from "@lucide/svelte/icons/history";
  import MoreHorizontalIcon from "@lucide/svelte/icons/ellipsis";
  import PaperclipIcon from "@lucide/svelte/icons/paperclip";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import TrashIcon from "@lucide/svelte/icons/trash-2";
  import type { AttachmentsState } from "../../../lib/ai/chat/panel/attachments.svelte.ts";
  import type { AiChatController } from "../../../lib/ai/chat/chat-controller.svelte.ts";
  import type { AiChatPanelProps } from "../../../lib/ai/chat/panel/props.ts";

  let {
    panelProps,
    controller,
    actions,
    attachmentsState,
  }: {
    panelProps: AiChatPanelProps;
    controller: AiChatController;
    actions: ChatPanelActions;
    attachmentsState: AttachmentsState;
  } = $props();
  const initializing = $derived(panelProps.initializing ?? false);
  const repository = $derived(panelProps.repository);
  const fileSearch = $derived(panelProps.fileSearch);
  const onRevealHistory = $derived(panelProps.onRevealHistory);
  const createConversation = $derived(panelProps.createConversation);
</script>

{#if repository}
  <Button
    size="icon-sm"
    variant="ghost"
    aria-label="Show conversation history"
    data-testid="ai-chat-history"
    onclick={() => void actions.perform(() => onRevealHistory?.())}
  >
    <HistoryIcon aria-hidden="true" />
  </Button>
{/if}
{#if fileSearch}
  <Popover.Root
    bind:open={attachmentsState.attachOpen}
    onOpenChange={attachmentsState.onAttachOpenChange}
  >
    <Popover.Trigger>
      {#snippet child({ props }: { props: Record<string, unknown> })}
        <Button
          {...props}
          size="icon-sm"
          variant="ghost"
          aria-label="Attach file"
          data-testid="ai-chat-attach"
          disabled={initializing}
        >
          <PaperclipIcon aria-hidden="true" />
        </Button>
      {/snippet}
    </Popover.Trigger>
    <Popover.Content
      data-ai-part="attach-popover"
      side="top"
      align="start"
      sideOffset={attachmentsState.attachSideOffset}
      avoidCollisions={false}
    >
      <CommandView.Root>
        <CommandView.Input placeholder="Search vault files" />
        <CommandView.List aria-label="Vault files">
          <CommandView.Empty>No vault files</CommandView.Empty>
          {#each attachmentsState.attachItems as item (item.id)}
            <CommandView.Item
              value={`${item.label} ${item.id}`}
              onSelect={() => attachmentsState.addAttachment(item)}
            >
              <CommandView.ItemLabel>{item.label}</CommandView.ItemLabel>
            </CommandView.Item>
          {/each}
        </CommandView.List>
      </CommandView.Root>
    </Popover.Content>
  </Popover.Root>
{/if}
{#if repository}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props }: { props: Record<string, unknown> })}
        <Button
          {...props}
          size="icon"
          variant="ghost"
          aria-label="Conversation actions"
          data-testid="ai-chat-conversation-menu"
        >
          <MoreHorizontalIcon aria-hidden="true" />
        </Button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content data-ai-part="conversation-menu" align="end">
      <DropdownMenu.Group>
        <DropdownMenu.Item
          disabled={!controller.location}
          onclick={() =>
            void actions.perform(() =>
              controller.archiveCurrent(
                controller.conversationStatus !== "archived",
              ),
            )}
        >
          {#if controller.conversationStatus === "archived"}
            <ArchiveRestoreIcon data-icon="inline-start" aria-hidden="true" />
            Restore Chat
          {:else}
            <ArchiveIcon data-icon="inline-start" aria-hidden="true" />
            Archive Chat
          {/if}
        </DropdownMenu.Item>
        <DropdownMenu.Item
          variant="destructive"
          disabled={!controller.location}
          onclick={() => void actions.perform(() => controller.deleteCurrent())}
        >
          <TrashIcon data-icon="inline-start" aria-hidden="true" />
          Delete Chat
        </DropdownMenu.Item>
        <DropdownMenu.Item
          onclick={() =>
            void actions.perform(() =>
              controller.newConversation(
                createConversation?.(controller.directoryContext) ?? {
                  scopeDir:
                    controller.directoryContext ||
                    controller.location?.scopeDir ||
                    "",
                },
              ),
            )}
        >
          <PlusIcon data-icon="inline-start" aria-hidden="true" />
          New Chat
        </DropdownMenu.Item>
      </DropdownMenu.Group>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/if}
