<script lang="ts">
  import type { WorkspaceSettingsPageProps } from "@lapismd/design-core/workspace/settings";
  import AiComputeField from "./AiComputeField.svelte";
  let { section }: WorkspaceSettingsPageProps = $props();
  const compute = $derived(
    section.fields?.find((field) => field.id === "ai.compute"),
  );
</script>

<div class="compute-settings-page">
  <header>
    <h1>{section.title}</h1>
    <p>{section.description}</p>
  </header>
  {#if compute?.type === "custom"}<AiComputeField field={compute} />{/if}
</div>

<style>
  .compute-settings-page {
    display: grid;
    gap: 0.85rem;
    min-width: 0;
  }
  h1 {
    margin: 0;
    font-size: var(--ui-workspace-settings-heading-size, 1rem);
    font-weight: 600;
  }
  p {
    margin: 0.35rem 0 0;
    color: var(--muted-foreground);
    font-size: 0.875rem;
  }
</style>
