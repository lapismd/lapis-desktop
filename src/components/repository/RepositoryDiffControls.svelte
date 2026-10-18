<script lang="ts">
  import type { FileDiffViewMode } from "@lapismd/design-core/diff";
  import { Toggle } from "@lapismd/design-core/shadcn/toggle";
  import * as ToggleGroup from "@lapismd/design-core/shadcn/toggle-group";
  import Columns2 from "@lucide/svelte/icons/columns-2";
  import Rows2 from "@lucide/svelte/icons/rows-2";
  import WrapText from "@lucide/svelte/icons/wrap-text";
  let {
    viewMode = $bindable("unified"),
    wrap = $bindable(false),
  }: { viewMode?: FileDiffViewMode; wrap?: boolean } = $props();
</script>

<div class="repository-diff-controls">
  <ToggleGroup.Root
    type="single"
    value={viewMode}
    onValueChange={(value) => {
      if (value === "unified" || value === "split") viewMode = value;
    }}
    variant="outline"
    size="sm"
    aria-label="Diff layout"
  >
    <ToggleGroup.Item
      value="unified"
      aria-label="Unified"
      title="Show unified diff"><Rows2 /></ToggleGroup.Item
    >
    <ToggleGroup.Item value="split" aria-label="Split" title="Show split diff"
      ><Columns2 /></ToggleGroup.Item
    >
  </ToggleGroup.Root>
  <Toggle
    bind:pressed={wrap}
    variant="outline"
    size="sm"
    aria-label="Wrap text"
    title="Wrap text"><WrapText /></Toggle
  >
</div>

<style>
  .repository-diff-controls {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }
</style>
