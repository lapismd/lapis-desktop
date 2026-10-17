<script lang="ts">
  import type { ChatPanelActions } from "../../../lib/ai/chat/panel/actions.ts";
  // SPDX-License-Identifier: Apache-2.0
  // Retained Lapis chat presentation; see src/lib/ai/NOTICE.md.
  import * as Chat from "@lapismd/design-core/ai/chat";
  import XIcon from "@lucide/svelte/icons/x";
  import AiApprovalCard from "./AiApprovalCard.svelte";
  import AiQuestionCard from "./AiQuestionCard.svelte";
  import type { AttachmentsState } from "../../../lib/ai/chat/panel/attachments.svelte.ts";
  import type { AiChatController } from "../../../lib/ai/chat/chat-controller.svelte.ts";
  import type { AiChatPanelProps } from "../../../lib/ai/chat/panel/props.ts";

  let {
    controller,
    actions,
    attachmentsState,
  }: {
    controller: AiChatController;
    actions: ChatPanelActions;
    attachmentsState: AttachmentsState;
  } = $props();
</script>

{#if attachmentsState.pendingInteraction || attachmentsState.attachments.length > 0}
  <div bind:this={attachmentsState.drawerHost}>
    <Chat.ComposerDrawer
      bind:collapsed={attachmentsState.drawerCollapsed}
      count={attachmentsState.attachments.length +
        (attachmentsState.pendingInteraction ? 1 : 0)}
      label={attachmentsState.pendingInteraction?.type === "approval"
        ? "Permission requested"
        : attachmentsState.pendingInteraction?.type === "question"
          ? "User input requested"
          : "Attachments"}
    >
      {#if attachmentsState.pendingInteraction?.type === "approval"}
        {@const requestId = attachmentsState.pendingInteraction.request.id}
        <AiApprovalCard
          request={attachmentsState.pendingInteraction.request}
          onRespond={(optionId) =>
            void actions.perform(() =>
              controller.respondToApproval(requestId, optionId),
            )}
        />
      {:else if attachmentsState.pendingInteraction?.type === "question"}
        {@const requestId = attachmentsState.pendingInteraction.request.id}
        <AiQuestionCard
          request={attachmentsState.pendingInteraction.request}
          onRespond={(answers) =>
            void actions.perform(() =>
              controller.respondToQuestion(requestId, answers),
            )}
        />
      {/if}
      {#if attachmentsState.attachments.length > 0}
        {#each attachmentsState.attachments as file (file.path)}
          <span data-ui-part="attachment-chip">
            <span>{file.name}</span>
            <button
              type="button"
              data-ui-part="attachment-remove"
              aria-label={`Remove ${file.name}`}
              onclick={() => attachmentsState.removeAttachment(file.path)}
            >
              <XIcon aria-hidden="true" />
            </button>
          </span>
        {/each}
      {/if}
    </Chat.ComposerDrawer>
  </div>
{/if}
