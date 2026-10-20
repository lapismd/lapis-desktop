<script lang="ts">
  // Adapted from the existing Agents settings page; storage stays host-owned.
  import type { WorkspaceSettingsPageProps } from "@lapismd/design-core/workspace/settings";
  import NativeConversationStorageField from "./NativeConversationStorageField.svelte";
  let { section }: WorkspaceSettingsPageProps = $props();
  const storage = $derived(
    section.fields?.find(
      (field) => field.id === "ai.nativeConversationStorage",
    ),
  );
</script>

<div class="native-history-settings-page">
  <header>
    <h1>{section.title}</h1>
    {#if section.description}<p>{section.description}</p>{/if}
  </header>
  {#if storage?.type === "custom"}<div data-setting-id={storage.id}>
      <NativeConversationStorageField field={storage} />
    </div>{/if}
</div>

<style>
  .native-history-settings-page {
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
