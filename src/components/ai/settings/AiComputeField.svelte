<script lang="ts">
  import AiComputeSettings from "./AiComputeSettings.svelte";
  import type { WorkspaceCustomSetting } from "@lapis-notes/api";
  import type { AiCompute } from "../../../lib/ai/settings/compute.svelte.ts";
  let { field }: { field: WorkspaceCustomSetting } = $props();
  const management = $derived(
    (field as WorkspaceCustomSetting & { management?: AiCompute }).management,
  );
</script>

{#if management}<AiComputeSettings {management} />{/if}
