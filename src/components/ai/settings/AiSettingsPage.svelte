<script lang="ts">
  // Adapted from RepositorySettingsPage: use the public settings composition.
  import {
    AppSettingsRoot,
    AppSettingsSection,
    type WorkspaceSettingsPageProps,
  } from "@lapismd/design-core/workspace/settings";
  import NativeConversationStorageField from "./NativeConversationStorageField.svelte";
  let { controller, app, section }: WorkspaceSettingsPageProps = $props();
  const titleId = $props.id();
  const history = $derived(
    section.fields?.find((field) => field.id === "ai.nativeHistory"),
  );
  const storage = $derived(
    history?.type === "group" ? history.fields[0] : undefined,
  );
  const general = $derived({
    ...section,
    fields: section.fields?.filter((field) => field.id !== "ai.nativeHistory"),
  });
</script>

<div class="ai-settings-page">
  <header>
    <h1>{section.title}</h1>
    {#if section.description}<p>{section.description}</p>{/if}
  </header>
  <AppSettingsRoot {controller} {app}>
    <AppSettingsSection section={general} />
  </AppSettingsRoot>
  {#if storage?.type === "custom"}
    <section aria-labelledby={titleId} data-setting-id={storage.id}>
      <h2 id={titleId}>Native conversation history</h2>
      <NativeConversationStorageField field={storage} />
    </section>
  {/if}
</div>

<style>
  .ai-settings-page {
    display: grid;
    gap: 1.75rem;
    min-width: 0;
  }
  section {
    min-width: 0;
  }
  h1,
  h2 {
    margin: 0;
    font-size: var(--ui-workspace-settings-heading-size, 1rem);
    font-weight: var(--ui-workspace-settings-heading-weight, 600);
    line-height: 1.25;
  }
  h2 {
    margin-bottom: 0.85rem;
  }
  p {
    margin: 0.35rem 0 0;
    color: var(--muted-foreground);
    font-size: 0.875rem;
  }
</style>
