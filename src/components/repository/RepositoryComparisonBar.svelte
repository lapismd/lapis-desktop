<script lang="ts">
  import type { Snippet } from "svelte";
  let {
    children,
    inset = false,
    label = "Comparison parent",
  }: { children: Snippet; inset?: boolean; label?: string } = $props();
</script>

<div class="repository-review-comparison-bar" data-inset={inset || undefined}>
  <span class="repository-review-comparison-label">{label}</span>
  {@render children()}
</div>

<style>
  .repository-review-comparison-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
    padding: 0.25rem 0.75rem;
    padding-inline-end: 0.5rem;
    border-block-start: 1px solid var(--border);
    background: color-mix(in srgb, var(--foreground) 4%, var(--background));
    font-size: 0.75rem;
  }
  .repository-review-comparison-bar[data-inset] {
    margin: -0.5rem -0.5rem 0.5rem;
    border-block-start: 0;
  }
  .repository-review-comparison-label {
    flex: none;
    white-space: nowrap;
    color: var(--muted-foreground);
  }
  .repository-review-comparison-bar
    :global(.repository-review-parent-selector) {
    position: relative;
    flex: 1;
    min-width: 0;
  }
  .repository-review-comparison-bar :global(.repository-review-parent-trigger) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    justify-content: flex-end;
    padding-inline: 0.375rem;
  }
  .repository-review-comparison-bar :global(.repository-review-parent-value) {
    position: relative;
    display: flex;
    min-width: 0;
    min-height: 2.25rem;
    box-sizing: border-box;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 1.625rem 0.375rem 0.375rem;
    pointer-events: none;
  }
  .repository-review-comparison-bar
    :global(.repository-review-parent-identifiers) {
    display: inline-flex;
    flex: none;
    pointer-events: auto;
  }
  .repository-review-comparison-bar :global(.repository-identifiers) {
    flex: none;
    flex-wrap: nowrap;
  }
</style>
