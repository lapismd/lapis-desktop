<script lang="ts">
  // SPDX-License-Identifier: Apache-2.0
  // Retained Lapis chat presentation; see src/lib/ai/NOTICE.md.
  import * as Chat from "@lapismd/design-core/ai/chat";
  import { Spinner } from "@lapismd/design-core/shadcn/spinner";
  import ChatComposerDrawer from "./ChatComposerDrawer.svelte";
  import ChatComposerActions from "./ChatComposerActions.svelte";
  import ChatComposerOptions from "./ChatComposerOptions.svelte";
  import ChatRecipients from "./ChatRecipients.svelte";
  import type { ComposerState } from "../../../lib/ai/chat/panel/composer.svelte.ts";
  import type { AttachmentsState } from "../../../lib/ai/chat/panel/attachments.svelte.ts";
  import type { ChatPanelActions } from "../../../lib/ai/chat/panel/actions.ts";
  import type { AiChatController } from "../../../lib/ai/chat/chat-controller.svelte.ts";
  import type { AiChatPanelProps } from "../../../lib/ai/chat/panel/props.ts";

  let {
    panelProps,
    controller,
    composerState,
    attachmentsState,
    actions,
  }: {
    panelProps: AiChatPanelProps;
    controller: AiChatController;
    composerState: ComposerState;
    attachmentsState: AttachmentsState;
    actions: ChatPanelActions;
  } = $props();
  const initializing = $derived(panelProps.initializing ?? false);
</script>

{#if composerState.showWorkingIndicator}
  <div
    class="ai-chat-panel__working"
    data-testid="ai-chat-working"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    <Spinner />
    <span>{composerState.workingLabel}</span>
  </div>
{/if}
<Chat.Composer
  bind:value={composerState.draft}
  placeholder="Ask anything…"
  disabled={initializing ||
    Boolean(composerState.catalogState?.loading) ||
    controller.busy}
  interactiveDrawerWhenDisabled={Boolean(attachmentsState.pendingInteraction)}
  isStopShown={controller.busy}
  status={composerState.composerStatus}
  statusPosition="top"
  triggers={composerState.mentionTriggers}
  onSubmit={(value) => void actions.submit(value)}
  onStop={() => {
    void actions.perform(() => controller.cancel());
  }}
>
  {#snippet drawer()}
    <ChatComposerDrawer {controller} {attachmentsState} {actions} />
  {/snippet}
  {#snippet headerActions()}
    <ChatComposerActions
      {panelProps}
      {controller}
      {attachmentsState}
      {actions}
    />
  {/snippet}
  {#snippet headerContext()}
    <ChatRecipients
      recipients={composerState.recipients.display}
      disabled={controller.busy || initializing}
      onRemove={(id) => composerState.recipients.remove(id)}
    />
    {#if controller.usage}
      <label
        class="ai-chat-panel__context-usage"
        title={`${actions.formatTokenCount(controller.usage.used)} of ${actions.formatTokenCount(controller.usage.limit)} tokens used`}
      >
        <span>Context</span>
        <progress
          aria-label="Context window usage"
          value={Math.min(controller.usage.used, controller.usage.limit)}
          max={controller.usage.limit}
        ></progress>
        <span>{composerState.contextPercent}%</span>
      </label>
    {/if}
  {/snippet}
  {#snippet footerActions()}
    <ChatComposerOptions {panelProps} {controller} {composerState} {actions} />
  {/snippet}
</Chat.Composer>
