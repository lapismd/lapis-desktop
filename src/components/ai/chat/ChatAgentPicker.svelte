<!-- SPDX-License-Identifier: Apache-2.0 -->
<script lang="ts">
  import type { TranscriptPanelProps } from "../../../lib/ai/chat/panel/transcript.ts";
  import ChatAgentSelector from "./ChatAgentSelector.svelte";
  let { panel }: { panel: TranscriptPanelProps } = $props();
  const { panelProps, controller, composerState } = $derived(panel);
</script>

<ChatAgentSelector
  {panelProps}
  busy={controller.busy}
  options={composerState.recipientOptions}
  selected={composerState.recipients.selectedIds}
  onMentionPerson={(person) => composerState.insertReference(person.value)}
  onAutoMentionChange={(value) =>
    composerState.setAutomaticallyMentionAgents(value)}
  onToggle={(id) => {
    if (composerState.recipients.selectedIds.includes(id))
      composerState.removeRecipient(id);
    else composerState.selectRecipient(id);
  }}
/>
