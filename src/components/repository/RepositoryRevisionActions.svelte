<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import HistoryIcon from "@lucide/svelte/icons/history";
  import GitMergeIcon from "@lucide/svelte/icons/git-merge";
  import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
  let {
    expanded = false,
    onEvolution,
    onResolve,
    onRestore,
  }: {
    expanded?: boolean;
    onEvolution?(): void;
    onResolve?(): void;
    onRestore?(): void;
  } = $props();
</script>

<div
  class="repository-review-revision-actions"
  role="toolbar"
  aria-label="Selected revision actions"
>
  {#if onEvolution}<Button
      size="xs"
      variant="outline"
      aria-label="Open Evo Log"
      aria-expanded={expanded}
      title="Show this commit's evolution history"
      onclick={onEvolution}
    >
      <HistoryIcon data-icon="inline-start" aria-hidden="true" />Evo Log
    </Button>{/if}
  {#if onResolve}<Button size="xs" variant="outline" onclick={onResolve}>
      <GitMergeIcon data-icon="inline-start" aria-hidden="true" />Resolve
      conflicts
    </Button>{/if}
  {#if onRestore}<Button size="xs" variant="outline" onclick={onRestore}
      ><RotateCcwIcon data-icon="inline-start" />Restore vault…</Button
    >{/if}
</div>

<style>
  .repository-review-revision-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    margin-block-start: -0.5rem;
    border-bottom: 1px solid var(--border);
    background: color-mix(in srgb, var(--foreground) 4%, var(--background));
  }
</style>
