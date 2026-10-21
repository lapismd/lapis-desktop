<script lang="ts">
  import type { WorkspaceSettingsPageProps } from "@lapismd/design-core/workspace/settings";
  import AiComputeField from "./AiComputeField.svelte";
  let { section }: WorkspaceSettingsPageProps = $props();
  const compute = $derived(
    section.fields?.find((field) => field.id === "ai.compute"),
  );
</script>

<div class="compute-settings-page">
  {#if compute?.type === "custom"}<AiComputeField field={compute} />{/if}
</div>

<style>
  .compute-settings-page {
    display: grid;
    gap: 0.85rem;
    min-width: 0;
  }
</style>
