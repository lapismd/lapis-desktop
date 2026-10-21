<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import ChatParticipantDialog from "./ChatParticipantDialog.svelte";
  import ChatPermissions from "./ChatPermissions.svelte";
  import PinIcon from "@lucide/svelte/icons/pin";
  import PinOffIcon from "@lucide/svelte/icons/pin-off";
  import ArchiveIcon from "@lucide/svelte/icons/archive";
  import ArchiveRestoreIcon from "@lucide/svelte/icons/archive-restore";
  import MoreVerticalIcon from "@lucide/svelte/icons/ellipsis-vertical";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import TrashIcon from "@lucide/svelte/icons/trash-2";
  import type { TranscriptPanelProps } from "../../../lib/ai/chat/panel/transcript.ts";

  let {
    panelProps,
    controller,
    actions,
    composerState,
  }: Pick<
    TranscriptPanelProps,
    "panelProps" | "controller" | "actions" | "composerState"
  > = $props();
  const initializing = $derived(panelProps.initializing ?? false);
  const repository = $derived(panelProps.repository);
  const createConversation = $derived(panelProps.createConversation);
  let participantOpen = $state(false);
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props }: { props: Record<string, unknown> })}
      <Button
        {...props}
        size="icon-sm"
        variant="ghost"
        aria-label="Conversation actions"
        data-testid="ai-chat-conversation-menu"
      >
        <MoreVerticalIcon aria-hidden="true" />
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
          <PlusIcon data-icon="inline-start" aria-hidden="true" />Add Agent
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
