<script lang="ts">
  import type { Snippet } from "svelte";
  import {
    TranscriptFooter,
    type TranscriptController,
  } from "@lapismd/design-core/chat";
  import type { TranscriptPanelProps } from "../../../lib/ai/chat/panel/transcript.ts";
  import ChatComposerActions from "./ChatComposerActions.svelte";
  import ChatComposerOptions from "./ChatComposerOptions.svelte";
  import ChatAgentPicker from "./ChatAgentPicker.svelte";
  import ChatScopeFooter from "./ChatScopeFooter.svelte";
  import ChatContextUsage from "./ChatContextUsage.svelte";
  let {
    panel,
    state,
    blocked,
    documentActions,
    onSend,
  }: {
    panel: TranscriptPanelProps;
    state: TranscriptController;
    blocked: boolean;
    documentActions?: Snippet;
    onSend: () => void;
  } = $props();
  const {
    panelProps,
    controller,
    composerState,
    attachmentsState,
    conversationsState,
  } = $derived(panel);
</script>

<TranscriptFooter
  busy={controller.busy || !!controller.queuedMessages.pending.length}
  {state}
  sendPending={state.sending ||
    !!state.retainedSubmission ||
    controller.queuedMessages.saving}
  hasContent={(!controller.busy || !!controller.repository) &&
    Boolean(composerState.draft.trim() || state.pending.length)}
  canSend={!controller.queuedMessages.saving &&
    Boolean(composerState.draft.trim() || state.pending.length)}
  disabled={blocked}
  {onSend}
  onStop={controller.busy
    ? () => panel.actions.perform(() => controller.cancel())
    : undefined}
  status={composerState.composerStatus}
  showStatus={!panelProps.transcriptFrame}
>
  {#snippet actions()}
    <ChatComposerActions
      {panelProps}
      {controller}
      {attachmentsState}
      {composerState}
      actions={panel.actions}
    />
    {@render documentActions?.()}
  {/snippet}

  {#snippet controls()}
    <div class="transcript-controls">
      <ChatAgentPicker {panel} />
      {#if panelProps.transcriptFrame}<ChatContextUsage
          {controller}
          {composerState}
          actions={panel.actions}
          variant="ring"
        />{/if}
      <ChatComposerOptions {panelProps} {composerState} />
    </div>
  {/snippet}
  {#snippet workspace()}<ChatScopeFooter
      inline
      {panelProps}
      {controller}
      {conversationsState}
      actions={panel.actions}
    />{/snippet}
</TranscriptFooter>

<style>
  .transcript-controls {
    gap: 0.25rem;
    display: flex;
    align-items: center;
  }
</style>
