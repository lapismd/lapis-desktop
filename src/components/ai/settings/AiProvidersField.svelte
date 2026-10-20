<script lang="ts">
  import AiProvidersSettings from "./AiProvidersSettings.svelte";
  import type { WorkspaceCustomSetting } from "@lapis-notes/api";
  import type { AiProviders } from "../../../lib/ai/settings/providers.svelte.ts";
  let { field }: { field: WorkspaceCustomSetting } = $props();
  const management = $derived(
    (field as WorkspaceCustomSetting & { management?: AiProviders }).management,
  );
</script>

{#if management}<AiProvidersSettings {management} />{/if}
