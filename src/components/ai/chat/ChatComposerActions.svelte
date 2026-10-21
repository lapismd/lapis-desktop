<script lang="ts">
  import ChatParticipantDialog from "./ChatParticipantDialog.svelte";
  import ChatPermissions from "./ChatPermissions.svelte";
  import type { ComposerState } from "../../../lib/ai/chat/panel/composer.svelte.ts";
  import PinIcon from "@lucide/svelte/icons/pin";
  import PinOffIcon from "@lucide/svelte/icons/pin-off";
  import type { ChatPanelActions } from "../../../lib/ai/chat/panel/actions.ts";
  // SPDX-License-Identifier: Apache-2.0
  // Retained Lapis chat presentation; see src/lib/ai/NOTICE.md.
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import FileIcon from "@lucide/svelte/icons/file";
  import VaultPathLabel from "./VaultPathLabel.svelte";
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
    composerState,
    compact = false,
  }: {
    compact?: boolean;
    panelProps: AiChatPanelProps;
    controller: AiChatController;
    actions: ChatPanelActions;
    attachmentsState: AttachmentsState;
    composerState: ComposerState;
  } = $props();
  const initializing = $derived(panelProps.initializing ?? false);
  const repository = $derived(panelProps.repository);
  const fileSearch = $derived(panelProps.fileSearch);
  const onRevealHistory = $derived(panelProps.onRevealHistory);
  const createConversation = $derived(panelProps.createConversation);
  let participantOpen = $state(false);
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
            <Tooltip.Provider
              ><Tooltip.Root>
                <Tooltip.Trigger>
                  {#snippet child({ props })}
                    <CommandView.Item
                      {...props}
                      value={`${item.label} ${item.id}`}
                      onSelect={() => attachmentsState.addAttachment(item)}
                    >
                      <CommandView.ItemIcon
                        ><FileIcon aria-hidden="true" /></CommandView.ItemIcon
                      >
                      <CommandView.ItemLabel>{item.label}</CommandView.ItemLabel
                      >
                      <CommandView.ItemDescription
                        ><VaultPathLabel
                          path={item.id}
                        /></CommandView.ItemDescription
                      >
                    </CommandView.Item>
                  {/snippet}
                </Tooltip.Trigger>
                <Tooltip.Content>{item.id}</Tooltip.Content>
              </Tooltip.Root></Tooltip.Provider
            >
          {/each}
        </CommandView.List>
      </CommandView.Root>
    </Popover.Content>
  </Popover.Root>
{/if}
<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props }: { props: Record<string, unknown> })}
      <Button
        {...props}
        size={compact ? "icon-sm" : "icon"}
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
      <ChatPermissions {panelProps} {controller} {composerState} />
      <DropdownMenu.Item
        disabled={initializing || !controller.location}
        onclick={() =>
          void actions.perform(() =>
            controller.setPinned(!controller.conversationPinned),
          )}
      >
        {#if controller.conversationPinned}
          <PinOffIcon data-icon="inline-start" aria-hidden="true" />Unpin Chat
        {:else}
          <PinIcon data-icon="inline-start" aria-hidden="true" />Pin Chat
        {/if}
      </DropdownMenu.Item>
    </DropdownMenu.Group>
    {#if repository}
      <DropdownMenu.Separator />
      <DropdownMenu.Group>
        <DropdownMenu.Item
          disabled={initializing ||
            controller.busy ||
            !panelProps.onSettingsChange}
          onclick={() => (participantOpen = true)}
        >
          <PlusIcon data-icon="inline-start" aria-hidden="true" />Add agent
          participant
        </DropdownMenu.Item>
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
    {/if}
  </DropdownMenu.Content>
</DropdownMenu.Root>

<ChatParticipantDialog bind:open={participantOpen} {panelProps} {controller} />
