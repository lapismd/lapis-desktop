<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import type { HistoryController } from "../../lib/repository/history-controller.ts";
  import { type HistoryState } from "../../lib/repository/history-state.ts";
  let {
    state,
    controller,
    copyText,
    onOpenDiff,
  }: {
    state: HistoryState;
    controller: HistoryController;
    onOpenDiff(): void;
    copyText(value: string): Promise<void>;
  } = $props();
  import RepositoryRevisionFiles from "./RepositoryRevisionFiles.svelte";
  import RepositoryGraph from "./RepositoryGraph.svelte";
  import { commitRows } from "../../lib/repository/graph/model.ts";
  const revisions = $derived(commitRows(state.commits));
</script>

<div class="repository-revisions">
  {#if !state.commitsReady && !state.busy}<p role="status">
      Revisions are unavailable. Refresh to try again.
    </p>
  {:else if state.commitsReady && !state.commits.length && !state.busy}<p>
      No revisions in this operation.
    </p>{/if}
  <RepositoryGraph
    {revisions}
    {copyText}
    selectedId={state.revision?.id}
    onSelect={(id) => {
      const commit = state.commits.find((item) => item.id === id);
      if (state.revision?.id === id) void controller.clearRevision();
      else if (commit) void controller.selectRevision(commit);
    }}
  >
    {#snippet selectedFiles()}<RepositoryRevisionFiles
        {state}
        {controller}
        {onOpenDiff}
      />{/snippet}
  </RepositoryGraph>
  {#if state.next}<Button
      size="sm"
      disabled={state.busy}
      onclick={() => controller.moreCommits()}>More revisions</Button
    >{/if}
  {#if state.commits.length === 200}<p>Showing the first 200 revisions.</p>{/if}
</div>

<style>
  .repository-revisions {
    min-width: 0;
  }
  p {
    padding: 0.75rem;
  }
</style>
