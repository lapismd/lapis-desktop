<script lang="ts">
  import {
    AppSettingsRoot,
    AppSettingsSection,
    type WorkspaceSettingsPageProps,
  } from "@lapismd/design-core/workspace/settings";
  let { controller, app, section }: WorkspaceSettingsPageProps = $props();
</script>

<div class="ai-settings-page">
  <header>
    <h1>{section.title}</h1>
    {#if section.description}<p>{section.description}</p>{/if}
  </header>
  <AppSettingsRoot {controller} {app}
    ><AppSettingsSection {section} /></AppSettingsRoot
  >
</div>

<style>
  .ai-settings-page {
    display: grid;
    gap: 1.75rem;
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
