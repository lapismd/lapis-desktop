<script lang="ts">
  import { FileDiff, type FileDiffViewMode } from "@lapismd/design-core/diff";
  import type { LocalFileDiffChange } from "@lapismd/jj-history";
  import { diffText } from "../../lib/repository/history-state.ts";
  let {
    change,
    viewMode = "unified",
    wrap = false,
    compact = false,
  }: {
    change: LocalFileDiffChange;
    viewMode?: FileDiffViewMode;
    wrap?: boolean;
    compact?: boolean;
  } = $props();
  const content = $derived(diffText(change));
</script>

<section
  class="repository-diff"
  data-compact={compact || undefined}
  data-view-mode={viewMode}
  aria-label={`Changes to ${change.path}`}
>
  {#if "unavailable" in content}<p role="status">
      Preview unavailable: {content.unavailable}.
    </p>
  {:else}<FileDiff
      path={change.path}
      oldText={content.oldText}
      newText={content.newText}
      {viewMode}
      {wrap}
    />{/if}
</section>

<style>
  .repository-diff {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 16rem;
  }
  .repository-diff[data-view-mode="split"] {
    height: 100%;
    min-height: 0;
    flex: 1 1 0;
  }
  .repository-diff[data-compact] {
    min-height: 0;
  }
  p {
    padding: 1rem;
    color: var(--muted-foreground);
  }
</style>
