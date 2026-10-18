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

<div class="repository-review-diff-controls">
  <span class="repository-review-diff-chrome">
    <ToggleGroup.Root
      type="single"
      value={viewMode}
      onValueChange={(value) => {
        if (value === "unified" || value === "split") viewMode = value;
      }}
      variant="outline"
      size="sm"
      class="repository-review-diff-group"
      aria-label="Diff layout"
    >
      <ToggleGroup.Item
        value="unified"
        onclick={(event) => {
          if (viewMode === "unified") event.preventDefault();
        }}
        class="repository-review-diff-control"
        aria-label="Unified"
        title="Show unified diff"
        ><Rows2 class="repository-review-diff-icon" /></ToggleGroup.Item
      >
      <ToggleGroup.Item
        value="split"
        onclick={(event) => {
          if (viewMode === "split") event.preventDefault();
        }}
        class="repository-review-diff-control"
        aria-label="Split"
        title="Show split diff"
        ><Columns2 class="repository-review-diff-icon" /></ToggleGroup.Item
      >
    </ToggleGroup.Root>
  </span>
  <span class="repository-review-diff-chrome">
    <Toggle
      bind:pressed={wrap}
      variant="outline"
      size="sm"
      class="repository-review-diff-control"
      aria-label="Wrap text"
      title="Wrap text"><WrapText class="repository-review-diff-icon" /></Toggle
    >
  </span>
</div>

<style>
  .repository-review-diff-controls {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }
  .repository-review-diff-chrome {
    display: inline-flex;
    align-items: stretch;
    width: fit-content;
    height: 1.375rem;
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: calc(var(--radius) * 0.6);
    background: var(--background);
    box-shadow: none;
  }
  .repository-review-diff-chrome :global(.repository-review-diff-group) {
    height: 100%;
    border: 0;
    box-shadow: none;
    background: transparent;
  }
  .repository-review-diff-chrome :global(.repository-review-diff-control) {
    box-sizing: border-box;
    width: 1.375rem;
    min-width: 1.375rem;
    height: 100%;
    padding: 0;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    background: transparent;
  }
  .repository-review-diff-chrome
    :global(.repository-review-diff-control + .repository-review-diff-control) {
    border-left: 1px solid var(--border);
  }
  .repository-review-diff-controls
    .repository-review-diff-chrome
    :global(.repository-review-diff-control .repository-review-diff-icon) {
    width: 0.75rem;
    height: 0.75rem;
  }
  .repository-review-diff-chrome
    :global(.repository-review-diff-control[data-state="on"]) {
    background: color-mix(in srgb, var(--foreground) 12%, var(--background));
    color: inherit;
  }
  .repository-review-diff-chrome
    :global(
      .repository-review-diff-control:not(:disabled):is(:hover, :focus-visible)
    ) {
    background: var(--repository-review-column-action-hover);
    color: var(--foreground);
  }
</style>
