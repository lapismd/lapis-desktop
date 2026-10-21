<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
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

{#if inspection.history.records.length}<div class="transcript-changes-action">
    <Button variant="ghost" size="sm" onclick={show}
      ><FileDiffIcon data-icon="inline-start" />Changes</Button
    >
  </div>{/if}

<style>
  .transcript-changes-action {
    display: flex;
    justify-content: flex-end;
    padding-inline: 0.75rem;
  }
</style>
