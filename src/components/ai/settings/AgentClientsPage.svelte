<script lang="ts">
  // Adapted from RepositorySettingsPage: retain the public settings shell.
  import type { WorkspaceSettingsPageProps } from "@lapismd/design-core/workspace/settings";
  import AgentClientsField from "./AgentClientsField.svelte";
  let { section }: WorkspaceSettingsPageProps = $props();
  const clients = $derived(
    section.fields?.find((field) => field.id === "ai.clients"),
  );
</script>

<div class="agents-settings-page">
  <header>
    <h1>{section.title}</h1>
    {#if section.description}<p>{section.description}</p>{/if}
  </header>
  {#if clients?.type === "custom"}
    <div data-setting-id={clients.id}>
      <AgentClientsField field={clients} />
    </div>
  {/if}
</div>

<style>
  .agents-settings-page {
    display: grid;
    gap: 0.85rem;
    min-width: 0;
  }
  header {
    display: grid;
    gap: 0.35rem;
  }
  h1 {
    margin: 0;
    font-size: var(--ui-workspace-settings-heading-size, 1rem);
    font-weight: var(--ui-workspace-settings-heading-weight, 600);
    line-height: 1.25;
  }
  p {
    margin: 0;
    color: var(--muted-foreground);
    font-size: 0.875rem;
  }
</style>
