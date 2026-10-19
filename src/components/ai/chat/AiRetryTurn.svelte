<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
  import type { TranscriptPanelProps } from "../../../lib/ai/chat/panel/transcript.ts";
  let { panel, errorId }: { panel: TranscriptPanelProps; errorId: string } =
    $props();
  const prompt = $derived(panel.actions.promptForError(errorId));
</script>

{#if prompt}
  <Tooltip.Provider delayDuration={0}
    ><Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}<Button
            {...props}
            size="icon-sm"
            variant="ghost"
            aria-label="Retry message"
            disabled={panel.controller.busy || !!panel.panelProps.initializing}
            onclick={() => prompt && void panel.actions.submit(prompt)}
            ><RotateCcwIcon aria-hidden="true" /></Button
          >{/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content role="tooltip" side="top">Retry message</Tooltip.Content>
    </Tooltip.Root></Tooltip.Provider
  >
{/if}
