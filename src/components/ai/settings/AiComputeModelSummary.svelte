<!-- Uses the Installed clients summary layout and public Design Core Avatar. -->
<script lang="ts">
  import { Avatar } from "@lapismd/design-core/shadcn/avatar";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import type { ComputeStatus } from "../../../lib/ai/settings/compute.svelte.ts";
  let {
    model,
    running,
    selected,
  }: {
    model: ComputeStatus["models"][number];
    running: boolean;
    selected: boolean;
  } = $props();
  const size = $derived(
    model.bytes === null
      ? "Size unavailable"
      : model.bytes >= 1e9
        ? `${(model.bytes / 1e9).toFixed(2)} GB`
        : `${(model.bytes / 1e6).toFixed(1)} MB`,
  );
</script>

<div class="store-runtime__summary">
  <Avatar name={model.name} size="md" decorative />
  <div class="store-runtime__copy">
    <div class="store-runtime__identity">
      <strong>{model.name}</strong>
      <Badge variant="outline"
        >{running
          ? "Running"
          : model.installed
            ? "Downloaded"
            : "Files missing"}</Badge
      >
      {#if selected}<Badge variant="secondary">Selected</Badge>{/if}
    </div>
    <p class="store-runtime__description">{size}</p>
    {#if model.name !== model.id}<p class="store-runtime__description">
        {model.id}
      </p>{/if}
  </div>
</div>
