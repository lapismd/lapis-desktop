<!-- Copied/adapted from JJ Store StoreComputeModelMetadata.svelte; Apache-2.0. -->
<script lang="ts">
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import {
    modelSizeLabel,
    type ComputeModelChoice,
  } from "../../../lib/ai/settings/compute-model-catalog.ts";
  let { model }: { model: ComputeModelChoice } = $props();
</script>

<span class="compute-model-meta">
  <span>{modelSizeLabel(model.sizeGb)}</span>
  <span data-fit={model.fit}>{model.fit}</span>
  {#if model.recommended}<Badge variant="secondary">Recommended</Badge>{/if}
  {#if model.installed}<Badge variant="outline">Installed</Badge>{/if}
  {#if !model.curated}<span>Advanced</span>{/if}
</span>

<style>
  .compute-model-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    color: var(--muted-foreground);
    font-size: 0.8rem;
  }
  [data-fit="Fits well"] {
    color: var(--success-foreground, var(--foreground));
  }
  [data-fit="Too large"] {
    color: var(--destructive);
  }
</style>
