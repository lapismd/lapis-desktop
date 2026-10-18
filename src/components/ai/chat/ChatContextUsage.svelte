<script lang="ts">
  import type { TranscriptPanelProps } from "../../../lib/ai/chat/panel/transcript.ts";
  let {
    controller,
    composerState,
    actions,
  }: Pick<TranscriptPanelProps, "controller" | "composerState" | "actions"> =
    $props();
</script>

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
