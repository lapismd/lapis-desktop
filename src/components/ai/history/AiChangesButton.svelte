<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import FileDiffIcon from "@lucide/svelte/icons/file-diff";
  import type { AiHistoryInspection } from "../../../lib/ai/chat/history-inspection.svelte.ts";
  let { inspection }: { inspection: AiHistoryInspection } = $props();
  function show() {
    const record = [...inspection.history.records]
      .reverse()
      .find((row) => row.phase !== "running");
    if (record) {
      inspection.scope = "conversation";
      void inspection.show(record);
    }
  }
</script>

{#if inspection.history.records.length}
  <Tooltip.Provider
    ><Tooltip.Root
      ><Tooltip.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="ghost"
            size="icon-sm"
            aria-label="Show conversation changes"
            onclick={show}><FileDiffIcon aria-hidden="true" /></Button
          >
        {/snippet}
      </Tooltip.Trigger><Tooltip.Content>Changes</Tooltip.Content></Tooltip.Root
    ></Tooltip.Provider
  >
{/if}
