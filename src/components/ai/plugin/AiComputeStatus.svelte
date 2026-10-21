<script lang="ts">
  import CpuIcon from "@lucide/svelte/icons/cpu";
  import AiComputeRunButton from "../settings/AiComputeRunButton.svelte";
  import type { AiCompute } from "../../../lib/ai/settings/compute.svelte.ts";
  let { management }: { management: AiCompute } = $props();
  const model = $derived(
    management.value?.models.find(
      (m) => m.id === management.value?.runtime.activeModel,
    ),
  );
  const name = $derived(model?.name ?? "Local model");
</script>

<div class="compute-status" role="group" aria-label="Running local model">
  <CpuIcon aria-hidden="true" /><span class="model-name">{name}</span>
  <AiComputeRunButton
    {name}
    running
    compact
    onActivate={() => management.stop()}
  />
</div>

<style>
  .compute-status {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-width: 0;
    height: 1.25rem;
    padding: 0 0.2rem;
    font: inherit;
  }
  .compute-status :global(svg) {
    flex: none;
    width: 0.8rem;
    height: 0.8rem;
  }
  .model-name {
    max-width: min(14rem, 30vw);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
