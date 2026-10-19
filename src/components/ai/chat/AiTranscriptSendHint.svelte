<script lang="ts">
  import {
    ComposerStatusBanner,
    type ComposerStatus,
  } from "@lapismd/design-core/chat";
  import type { TranscriptPanelProps } from "../../../lib/ai/chat/panel/transcript.ts";
  let {
    panel,
    error,
  }: { panel: TranscriptPanelProps; error?: string | null | undefined } =
    $props();
  const { controller, composerState } = $derived(panel);
  const latest = $derived(
    controller.items
      .slice()
      .reverse()
      .find((item) => item.type === "error" || item.type === "message"),
  );
  const status = $derived<ComposerStatus | undefined>(
    latest?.type === "error" &&
      (!composerState.composerStatus ||
        composerState.composerStatus.message === latest.text)
      ? undefined
      : (composerState.composerStatus ??
          (error ? { type: "error", message: error } : undefined)),
  );
</script>

<div class="transcript-send-hint">
  {#if status}<ComposerStatusBanner {status} position="standalone" />{/if}
  <span>Ctrl/⌘+Enter to send</span>
</div>

<style>
  .transcript-send-hint {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    gap: 0.25rem;
    min-height: 1.5rem;
    padding: 0.25rem 0.5rem;
    color: var(--muted-foreground);
    font-size: 0.6875rem;
    line-height: 1rem;
    --ui-composer-status-radius: var(--radius);
  }
  .transcript-send-hint > span {
    padding-inline: 0.5rem;
  }
</style>
