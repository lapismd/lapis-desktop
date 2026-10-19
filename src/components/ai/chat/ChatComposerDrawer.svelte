<script lang="ts">
  import type { ChatPanelActions } from "../../../lib/ai/chat/panel/actions.ts";
  // SPDX-License-Identifier: Apache-2.0
  // Retained Lapis chat presentation; see src/lib/ai/NOTICE.md.
  import * as Chat from "@lapismd/design-core/ai/chat";
  import * as Collapsible from "@lapismd/design-core/shadcn/collapsible";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import PaperclipIcon from "@lucide/svelte/icons/paperclip";
  import ChatAttachedFiles from "./ChatAttachedFiles.svelte";
  import AiApprovalCard from "./AiApprovalCard.svelte";
  import AiQuestionCard from "./AiQuestionCard.svelte";
  import type { AttachmentsState } from "../../../lib/ai/chat/panel/attachments.svelte.ts";
  import type { AiChatController } from "../../../lib/ai/chat/chat-controller.svelte.ts";

  let {
    controller,
    actions,
    attachmentsState,
    presentation = "framed",
  }: {
    presentation?: "framed" | "document";
    controller: AiChatController;
    actions: ChatPanelActions;
    attachmentsState: AttachmentsState;
  } = $props();
</script>

{#snippet contents()}
  {#if attachmentsState.pendingInteraction?.type === "approval"}
    {@const requestId = attachmentsState.pendingInteraction.request.id}
    {@const itemId = attachmentsState.pendingInteraction.id}
    <AiApprovalCard
      request={attachmentsState.pendingInteraction.request}
      onRespond={(optionId) =>
        void actions.perform(() =>
          controller.respondToApproval(requestId, optionId, itemId),
        )}
    />
  {:else if attachmentsState.pendingInteraction?.type === "question"}
    {@const requestId = attachmentsState.pendingInteraction.request.id}
    {@const itemId = attachmentsState.pendingInteraction.id}
    <AiQuestionCard
      request={attachmentsState.pendingInteraction.request}
      onRespond={(answers) =>
        void actions.perform(() =>
          controller.respondToQuestion(requestId, answers, itemId),
        )}
    />
  {/if}
  <ChatAttachedFiles {attachmentsState} />
{/snippet}

{#if attachmentsState.pendingInteraction || attachmentsState.attachments.length > 0}
  {@const label =
    attachmentsState.pendingInteraction?.type === "approval"
      ? "Permission requested"
      : attachmentsState.pendingInteraction?.type === "question"
        ? "User input requested"
        : "Attachments"}
  {@const count =
    attachmentsState.attachments.length +
    (attachmentsState.pendingInteraction ? 1 : 0)}
  <div
    bind:this={attachmentsState.drawerHost}
    class:document-attachments={presentation === "document"}
  >
    {#if presentation === "document"}
      <Collapsible.Root
        open={!attachmentsState.drawerCollapsed}
        onOpenChange={(open) => (attachmentsState.drawerCollapsed = !open)}
        data-testid="ai-attachment-section"
        data-presentation="document"
      >
        <Collapsible.Trigger>
          {#snippet child({ props })}
            <button
              {...props}
              type="button"
              class="disclosure"
              aria-label={`${attachmentsState.drawerCollapsed ? "Expand" : "Collapse"} ${label} ${count}`}
            >
              <ChevronRightIcon
                class={attachmentsState.drawerCollapsed ? "" : "open"}
                aria-hidden="true"
              />
              <PaperclipIcon aria-hidden="true" /><span>{label}</span>{" "}<span
                class="count">{count}</span
              >
            </button>
          {/snippet}
        </Collapsible.Trigger>
        <Collapsible.Content
          ><div class="files">{@render contents()}</div></Collapsible.Content
        >
      </Collapsible.Root>
    {:else}
      <Chat.ComposerDrawer
        bind:collapsed={attachmentsState.drawerCollapsed}
        {count}
        {label}
      >
        {@render contents()}
      </Chat.ComposerDrawer>
    {/if}
  </div>
{/if}

<style>
  .document-attachments {
    min-width: 0;
    margin-inline-start: 2rem;
  }
  .disclosure {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0;
    border: 0;
    background: transparent;
    color: var(--muted-foreground);
    font: inherit;
    font-size: 0.75rem;
    cursor: pointer;
  }
  .disclosure:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
    border-radius: 0.25rem;
  }
  .disclosure :global(svg) {
    width: 0.875rem;
    height: 0.875rem;
  }
  .disclosure :global(.open) {
    transform: rotate(90deg);
  }
  .count {
    font-variant-numeric: tabular-nums;
  }
  .files {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    padding-block: 0.375rem;
  }
</style>
