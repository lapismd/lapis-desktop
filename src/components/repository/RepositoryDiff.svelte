<script lang="ts">
  import { FileDiff, type FileDiffViewMode } from "@lapismd/design-core/diff";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import type { LocalFileDiffChange } from "@lapismd/jj-history";
  import { diffText } from "../../lib/repository/history-state.ts";
  let { change }: { change: LocalFileDiffChange } = $props();
  let viewMode = $state<FileDiffViewMode>("unified");
  const content = $derived(diffText(change));
</script>

<section class="repository-diff" aria-label={`Changes to ${change.path}`}>
  <header>
    <strong>{change.path}</strong>
    <div role="group" aria-label="Diff layout">
      {#each ["unified", "split"] as mode}
        <Button
          size="sm"
          variant="ghost"
          aria-pressed={viewMode === mode}
          onclick={() => (viewMode = mode as FileDiffViewMode)}
        >
          {mode === "unified" ? "Unified" : "Split"}
        </Button>
      {/each}
    </div>
  </header>
  {#if "unavailable" in content}
    <p role="status">Preview unavailable: {content.unavailable}.</p>
  {:else}
    <FileDiff
      path={change.path}
      oldText={content.oldText}
      newText={content.newText}
      {viewMode}
    />
  {/if}
</section>

<style>
  .repository-diff {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 16rem;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem;
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
  }
  strong {
    overflow-wrap: anywhere;
    font-size: 0.875rem;
  }
  p {
    padding: 1rem;
    color: var(--muted-foreground);
  }
</style>
