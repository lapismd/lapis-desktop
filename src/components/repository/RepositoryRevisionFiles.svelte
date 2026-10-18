<script lang="ts">
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
    <label
      >Compare with parent
      <select
        aria-label="Compare with parent"
        value={state.base ?? ""}
        onchange={(event) => controller.selectBase(event.currentTarget.value)}
      >
        <option value="" disabled>Choose a parent</option>
        {#each state.revision.parents as parent (parent)}<option value={parent}
            >{parent}</option
          >{/each}
      </select>
    </label>
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
  label {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.375rem;
    margin-bottom: 0.5rem;
  }
  select {
    min-width: 0;
    flex: 1;
    width: 100%;
    padding: 0.375rem;
    background: var(--background);
    color: var(--foreground);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
</style>
