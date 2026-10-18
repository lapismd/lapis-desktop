<script lang="ts">
  import {
    FileListing,
    FileListingViewModeToggle,
    type FileListingFile,
    type FileListingViewMode,
  } from "@lapismd/design-core/diff";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  let {
    files,
    selectedPath,
    initialLoading = false,
    loading = false,
    hasMore = false,
    onSelect,
    onMore,
  }: {
    files: FileListingFile[];
    selectedPath?: string;
    initialLoading?: boolean;
    loading?: boolean;
    hasMore?: boolean;
    onSelect(path: string): void;
    onMore(): void;
  } = $props();
  let mode = $state<FileListingViewMode>("tree");
</script>

<section
  class="repository-changed-files"
  aria-label="Changed files"
  aria-busy={loading || initialLoading}
>
  <header>
    <strong>Changed files</strong><span class="file-count"
      >{#if initialLoading}<Skeleton />{:else}{files.length}{/if}</span
    ><FileListingViewModeToggle bind:mode />
  </header>
  <div class="file-list">
    {#if initialLoading}<p role="status">Loading changed files…</p>
    {:else}<FileListing
        {files}
        {mode}
        {selectedPath}
        virtualize={false}
        {hasMore}
        {loading}
        onSelectPath={onSelect}
        onLoadMore={onMore}
      />{/if}
  </div>
</section>

<style>
  .repository-changed-files {
    display: flex;
    flex-direction: column;
    min-width: 0;
    max-height: 16rem;
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    background: var(--background);
    --ui-diff-row-hover: color-mix(
      in srgb,
      var(--foreground) 7%,
      var(--background)
    );
    --ui-diff-selected: color-mix(
      in srgb,
      var(--foreground) 12%,
      var(--background)
    );
  }
  header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.65rem;
    border-bottom: 1px solid var(--border);
  }
  strong {
    flex: 1;
    min-width: 0;
    font-size: 0.8125rem;
  }
  .file-count {
    display: inline-flex;
    border-radius: 999px;
    padding: 0.05rem 0.4rem;
    background: var(--muted);
    font-size: 0.75rem;
  }
  .file-list {
    min-width: 0;
    min-height: 0;
    overflow: auto;
    padding: 0.25rem 0.35rem;
  }
  p {
    font-size: 0.75rem;
    color: var(--muted-foreground);
  }
</style>
