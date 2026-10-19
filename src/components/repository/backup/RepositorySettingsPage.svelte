<script lang="ts">
  import {
    AppSettingsRoot,
    AppSettingsSection,
    type WorkspaceSettingsPageProps,
  } from "@lapismd/design-core/workspace/settings";
  import { BACKUP_SETTINGS } from "./backup-settings.ts";
  import BackupSettingsField from "./BackupSettingsField.svelte";
  let { controller, app, section }: WorkspaceSettingsPageProps = $props();
  const titleId = $props.id();
  const backup = $derived(
    section.fields?.find((field) => field.id === BACKUP_SETTINGS),
  );
  const general = $derived({
    ...section,
    fields: section.fields?.filter((field) => field.id !== BACKUP_SETTINGS),
  });
</script>

<div class="repository-settings-page">
  <AppSettingsRoot {controller} {app}>
    <AppSettingsSection section={general} />
  </AppSettingsRoot>
  {#if backup?.type === "custom"}
    <section
      class="repository-backup-section"
      aria-labelledby={titleId}
      data-setting-id={BACKUP_SETTINGS}
    >
      <h2 id={titleId}>Backup and synchronisation</h2>
      <BackupSettingsField field={backup} />
    </section>
  {/if}
</div>

<style>
  .repository-settings-page {
    display: grid;
    gap: 1.75rem;
    min-width: 0;
  }
  .repository-backup-section {
    min-width: 0;
  }
  h2 {
    margin: 0 0 0.85rem;
    font-size: var(--ui-workspace-settings-heading-size, 1rem);
    font-weight: var(--ui-workspace-settings-heading-weight, 600);
    line-height: 1.25;
  }
</style>
