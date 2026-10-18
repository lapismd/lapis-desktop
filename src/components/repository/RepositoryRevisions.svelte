<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import type { HistoryController } from "../../lib/repository/history-controller.ts";
  import { type HistoryState } from "../../lib/repository/history-state.ts";
  let {
    state,
    controller,
    copyText,
    onOpenDiff,
    onOpenEvolution,
    onResolveConflicts,
    evolutionOpen = false,
    graphRevisions,
    graphLabel = "Revision graph",
    comparisonTargets,
    comparisonLabel,
    comparisonUnavailable,
  }: {
    state: HistoryState;
    controller: Pick<
      HistoryController,
      | "clearRevision"
      | "selectRevision"
      | "moreCommits"
      | "loadParents"
      | "selectBase"
      | "selectPath"
      | "morePaths"
    >;
    onOpenDiff(): void;
    onOpenEvolution?(): void;
    onResolveConflicts?(): void;
    evolutionOpen?: boolean;
    graphRevisions?: import("../../lib/repository/graph/model.ts").RepositoryLogRevision[];
    graphLabel?: string;
    comparisonTargets?: readonly string[];
    comparisonLabel?: string;
    comparisonUnavailable?: string;
    copyText(value: string): Promise<void>;
  } = $props();
  import RepositoryRevisionFiles from "./RepositoryRevisionFiles.svelte";
  import RepositoryCommitMessage from "./RepositoryCommitMessage.svelte";
  import RepositoryRevisionActions from "./RepositoryRevisionActions.svelte";
  import RepositoryGraph from "./RepositoryGraph.svelte";
  import { commitRows } from "../../lib/repository/graph/model.ts";
  const hasMessageBody = $derived(
    Boolean(state.revision?.description.split("\n").slice(1).join("\n").trim()),
  );
  const revisions = $derived(graphRevisions ?? commitRows(state.commits));
</script>

<div class="repository-revisions">
  {#if !state.commitsReady && !state.busy}<p role="status">
      Revisions are unavailable. Refresh to try again.
    </p>
  {:else if state.commitsReady && !state.commits.length && !state.busy}<p>
      No revisions in this operation.
    </p>{/if}
  <RepositoryGraph
    commits={state.commits}
    {revisions}
    {copyText}
    selectedId={state.revision?.id}
    label={graphLabel}
    onSelect={(id) => {
      const commit = state.commits.find((item) => item.id === id);
      if (state.revision?.id === id) void controller.clearRevision();
      else if (commit) void controller.selectRevision(commit);
    }}
  >
    {#snippet selectedFiles()}
      {#if onOpenEvolution || (state.revision?.conflicted && onResolveConflicts)}<RepositoryRevisionActions
          expanded={evolutionOpen}
          onEvolution={onOpenEvolution}
          onResolve={state.revision?.conflicted
            ? onResolveConflicts
            : undefined}
        />{/if}
      <RepositoryCommitMessage
        description={state.revision?.description ?? ""}
      />
      {#if !comparisonUnavailable}<RepositoryRevisionFiles
          {copyText}
          {state}
          {controller}
          {onOpenDiff}
          {comparisonTargets}
          {comparisonLabel}
          separateActions={!hasMessageBody &&
            Boolean(
              onOpenEvolution ||
                (state.revision?.conflicted && onResolveConflicts),
            )}
        />{/if}{/snippet}
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
