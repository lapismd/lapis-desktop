<script lang="ts">
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import type { TranscriptPanelProps } from "../../../lib/ai/chat/panel/transcript.ts";
  let {
    controller,
    composerState,
    actions,
    variant = "bar",
  }: Pick<TranscriptPanelProps, "controller" | "composerState" | "actions"> & {
    variant?: "bar" | "ring";
  } = $props();
</script>

{#if controller.usage}
  {#if variant === "ring"}
    <Tooltip.Provider delayDuration={0}
      ><Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}<Button
              {...props}
              variant="ghost"
              size="icon-sm"
              aria-label={`Context window: ${composerState.contextPercent}% full`}
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle
                  class="context-ring-track"
                  cx="10"
                  cy="10"
                  r="7"
                  stroke-width="3"
                />
                <circle
                  class="context-ring-value"
                  cx="10"
                  cy="10"
                  r="7"
                  stroke-width="3"
                  pathLength="100"
                  stroke-dasharray={`${composerState.contextPercent} 100`}
                  stroke-linecap="round"
                  transform="rotate(-90 10 10)"
                />
              </svg>
            </Button>{/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content role="tooltip" side="top" align="end" sideOffset={8}>
          <div class="context-ring-details">
            <span>Context window:</span>
            <span>{composerState.contextPercent}% full</span>
            <strong
              >{actions.formatTokenCount(controller.usage.used)} / {actions.formatTokenCount(
                controller.usage.limit,
              )} tokens used</strong
            >
          </div>
        </Tooltip.Content>
      </Tooltip.Root></Tooltip.Provider
    >
  {:else}
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
{/if}

<style>
  .context-ring-track {
    stroke: var(--muted-foreground);
    opacity: 0.25;
  }
  .context-ring-value {
    stroke: var(--muted-foreground);
  }
  .context-ring-details {
    display: grid;
    gap: 0.125rem;
    padding: 0.25rem 0.375rem;
    text-align: center;
    line-height: 1.5;
  }
  .context-ring-details > span {
    opacity: 0.75;
  }
  .context-ring-details strong {
    font-weight: 500;
  }
</style>
