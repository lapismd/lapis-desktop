<script lang="ts">
  import RepositoryCommitPicker from "./RepositoryCommitPicker.svelte";
  import { FileChangeStats } from "@lapismd/design-core/diff";
  import { changeStats } from "../../lib/repository/history-files.ts";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import type { HistoryController } from "../../lib/repository/history-controller.ts";
  import type { HistoryState } from "../../lib/repository/history-state.ts";
  import { listingFiles } from "../../lib/repository/history-files.ts";
  import RepositoryChangedFiles from "./RepositoryChangedFiles.svelte";
  let {
    state,
    controller,
    onOpenDiff,
  }: {
    state: HistoryState;
    controller: HistoryController;
    onOpenDiff(): void;
  } = $props();
  const files = $derived(listingFiles(state.paths, state.diff));
</script>

<div class="revision-files">
  {#if state.revision?.parents.length}
    <RepositoryCommitPicker
      parents={state.revision.parents}
      revisions={[...state.commits, ...state.parentCommits]}
      target={state.base}
      loading={state.busy}
      onOpen={() => void controller.loadParents()}
      onSelect={(id) => void controller.selectBase(id)}
    >
      {#snippet statistics()}
        <div
          class="comparison-statistics"
          aria-label="Selected comparison statistics"
        >
          {#if state.base && state.pathsReady}<span
              >{state.paths.length}{state.nextPath ? "+" : ""}
              {state.paths.length === 1 && !state.nextPath ? "file" : "files"} in
              selected comparison</span
            >{/if}
          {#if state.path && changeStats(state.diff)}<span
              >Selected file: {state.path}
              <FileChangeStats {...changeStats(state.diff)} /></span
            >{/if}
        </div>
      {/snippet}
    </RepositoryCommitPicker>
    {#if state.base}
      {#if state.pathsReady || state.busy}<RepositoryChangedFiles
          {files}
          selectedPath={state.path}
          initialLoading={!state.pathsReady && state.busy}
          loading={state.busy}
          hasMore={!!state.nextPath}
          onSelect={(path) => {
            onOpenDiff();
            void controller.selectPath(path);
          }}
          onMore={() => void controller.morePaths()}
        />{/if}
      {#if !state.pathsReady && !state.busy}<p role="status">
          File changes are unavailable.
        </p>
        <Button size="sm" onclick={() => controller.selectBase(state.base!)}
          >Retry comparison</Button
        >
      {:else if state.pathsReady && !state.paths.length && !state.busy}<p>
          No changed files in this comparison.
        </p>{/if}
      {#if state.paths.length === 500}<p>
          Showing the first 500 changed files.
        </p>{/if}
    {/if}
  {:else}<p role="status">This revision has no parent comparison.</p>{/if}
</div>

<style>
  .revision-files {
    padding: 0 0.5rem 0.5rem;
    font-size: 0.8125rem;
  }
  .comparison-statistics {
    display: grid;
    gap: 0.25rem;
  }
  .comparison-statistics > span {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.375rem;
  }
</style>
