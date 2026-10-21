<script lang="ts">
  import type { TranscriptBlock } from "@lapismd/design-core/chat";
  import AiTurnChanges from "./AiTurnChanges.svelte";
  import AiTranscriptBlock from "../chat/AiTranscriptBlock.svelte";
  import { transcriptSourceItem } from "../../../lib/ai/chat/transcript-projection.ts";
  import type { TranscriptPanelProps } from "../../../lib/ai/chat/panel/transcript.ts";
  import type { AiHistoryInspection } from "../../../lib/ai/chat/history-inspection.svelte.ts";
  let {
    block,
    panel,
    inspection,
  }: {
    block: TranscriptBlock;
    panel: TranscriptPanelProps;
    inspection: AiHistoryInspection;
  } = $props();
  const item = $derived(transcriptSourceItem(block, panel.controller.items));
  const record = $derived(
    inspection.history.records.find(
      (row) => block.id === `history/${row.context.turn}`,
    ),
  );
</script>

{#if record}<AiTurnChanges {record} {inspection} busy={panel.controller.busy} />
{:else if item}<AiTranscriptBlock {item} {panel} />{/if}
