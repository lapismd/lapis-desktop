<script lang="ts">
  import ChatConversationMenu from "./ChatConversationMenu.svelte";
  import ChatApprovalPolicy from "./ChatApprovalPolicy.svelte";
  import type { ComposerState } from "../../../lib/ai/chat/panel/composer.svelte.ts";
  import type { ChatPanelActions } from "../../../lib/ai/chat/panel/actions.ts";
  // SPDX-License-Identifier: Apache-2.0
  // Retained Lapis chat presentation; see src/lib/ai/NOTICE.md.
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import FileIcon from "@lucide/svelte/icons/file";
  import VaultPathLabel from "./VaultPathLabel.svelte";
  import HistoryIcon from "@lucide/svelte/icons/history";
  import PaperclipIcon from "@lucide/svelte/icons/paperclip";
  import type { AttachmentsState } from "../../../lib/ai/chat/panel/attachments.svelte.ts";
  import type { AiChatController } from "../../../lib/ai/chat/chat-controller.svelte.ts";
  import type { AiChatPanelProps } from "../../../lib/ai/chat/panel/props.ts";

  let {
    panelProps,
    controller,
    actions,
    attachmentsState,
    composerState,
  }: {
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
<ChatApprovalPolicy {panelProps} {composerState} />
{#if !panelProps.transcriptFrame}
  <ChatConversationMenu {panelProps} {controller} {actions} {composerState} />
{/if}
