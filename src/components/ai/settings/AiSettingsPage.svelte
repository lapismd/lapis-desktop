<script lang="ts">
  // Follow AgentClientsPage: custom settings cards own their section presentation.
  import {
    AppSettingsRoot,
    AppSettingsSection,
    type WorkspaceSettingsPageProps,
  } from "@lapismd/design-core/workspace/settings";
  import AiProvidersField from "./AiProvidersField.svelte";
  import AiComputeField from "./AiComputeField.svelte";
  let { controller, app, section }: WorkspaceSettingsPageProps = $props();
  const provider = $derived(
    section.fields?.find((field) => field.id === "ai.providers"),
  );
  const compute = $derived(
    section.fields?.find((field) => field.id === "ai.compute"),
  );
  const general = $derived({
    ...section,
    fields: section.fields?.filter(
      (field) => field.id !== "ai.providers" && field.id !== "ai.compute",
    ),
  });
</script>

<div class="ai-settings-page">
  <header>
    <h1>{section.title}</h1>
    {#if section.description}<p>{section.description}</p>{/if}
  </header>
  {#if provider?.type === "custom"}
    <div data-setting-id={provider.id}>
      <AiProvidersField field={provider} />
    </div>
  {/if}
  {#if compute?.type === "custom"}
    <div data-setting-id={compute.id}>
      <AiComputeField field={compute} />
    </div>
  {/if}
  <AppSettingsRoot {controller} {app}>
    <AppSettingsSection section={general} />
  </AppSettingsRoot>
</div>

<style>
  .ai-settings-page {
    display: grid;
    gap: 0.85rem;
    min-width: 0;
  }
  h1 {
    margin: 0;
    font-size: var(--ui-workspace-settings-heading-size, 1rem);
    font-weight: var(--ui-workspace-settings-heading-weight, 600);
    line-height: 1.25;
  }
  p {
    margin: 0.35rem 0 0;
    color: var(--muted-foreground);
    font-size: 0.875rem;
  }
</style>
