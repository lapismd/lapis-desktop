<script lang="ts">
  import { untrack } from "svelte";
  import type {
    LocalGraphCommit,
    LocalGraphEvolutionNode,
  } from "@lapismd/jj-history";
  import * as ColumnCanvas from "@lapismd/design-core/shadcn/column-canvas";
  import ReviewRevisions from "../../../../src/components/repository/RepositoryRevisions.svelte";
  import ReviewHistoryDiff from "../../../../src/components/repository/RepositoryDiffColumn.svelte";
  import {
    initialHistoryState,
    type HistoryState,
  } from "../../../../src/lib/repository/history-state.ts";
  import { commitRows } from "../../../../src/lib/repository/graph/model.ts";
  import { reviewEvolutionHistory } from "./review-evolution.ts";
  import { reviewEvolutionComparison } from "./review-evolution-comparison.ts";
  let {
    nodes,
    anchor,
    operation,
    baseCommits,
    onOpenDiff,
    onCloseDiff,
    onClose,
    copyText,
  }: {
    nodes: readonly LocalGraphEvolutionNode[];
    anchor?: string;
    operation?: string;
    baseCommits: readonly LocalGraphCommit[];
    onOpenDiff(): void;
    onCloseDiff(): void;
    onClose(): void;
    copyText(value: string): Promise<void>;
  } = $props();
  let selected = $state<string>(),
    selectedPath = $state<string>();
  $effect(() => {
    selected = anchor;
    selectedPath = undefined;
    untrack(onCloseDiff);
  });
  const history = $derived(reviewEvolutionHistory(nodes, anchor));
  const commits = $derived(history.map((node) => node.commit));
  const rows = $derived(
    commitRows(commits).map((row, index) => ({
      ...row,
      parents: history[index].predecessors,
    })),
  );
  const comparison = $derived(reviewEvolutionComparison(nodes, selected));
  const snapshot: HistoryState = $derived({
    ...initialHistoryState(),
    phase: "ready",
    operation,
    commits,
    commitsReady: true,
    revision: commits.find((commit) => commit.id === selected),
    parentCommits: [...nodes.map((node) => node.commit), ...baseCommits],
    base: comparison.from,
    paths: comparison.paths ?? [],
    pathsReady: Boolean(comparison.from),
    path: selectedPath,
    diff: selectedPath ? comparison.change : undefined,
  });
  const controller = {
    async selectRevision(commit: LocalGraphCommit) {
      if (!history.some((node) => node.commit.id === commit.id)) return;
      selected = commit.id;
      selectedPath = undefined;
      onCloseDiff();
    },
    async clearRevision() {
      selected = undefined;
      selectedPath = undefined;
      onCloseDiff();
    },
    async selectPath(path: string) {
      if (comparison.paths?.some((file) => file.path === path))
        selectedPath = path;
    },
    async selectBase(_id: string) {},
    async loadParents() {},
    async morePaths() {},
    async moreCommits() {},
  };
</script>

<ColumnCanvas.Column
  id="evolution"
  columnTitle="Evo Log"
  aria-label="Evolution history"
>
  <ColumnCanvas.Header>
    <ColumnCanvas.Title>Evo Log</ColumnCanvas.Title>
    <ColumnCanvas.Count>{history.length}</ColumnCanvas.Count>
    <ColumnCanvas.HeaderActions class="review-column-actions">
      <ColumnCanvas.Close
        aria-label="Close Evo Log column"
        title="Close Evo Log"
        onclick={() => {
          onCloseDiff();
          onClose();
        }}
      />
    </ColumnCanvas.HeaderActions>
  </ColumnCanvas.Header>
  <ColumnCanvas.Body orientation="both">
    {#if history.length}
      <ReviewRevisions
        state={snapshot}
        {controller}
        {copyText}
        graphRevisions={rows}
        graphLabel="Evolution log"
        {onOpenDiff}
        comparisonTargets={comparison.from ? [comparison.from] : []}
        comparisonLabel={comparison.label}
        comparisonUnavailable={comparison.message}
      />
    {:else}<p>No recorded evolution history for this commit.</p>{/if}
  </ColumnCanvas.Body>
</ColumnCanvas.Column>

<ReviewHistoryDiff
  state={snapshot}
  {controller}
  columnId="evolution-diff"
  label="Evolution file changes"
  closeLabel="Close Evo Log Diff column"
/>

<style>
  p {
    margin: 0;
    padding: 1rem;
    color: var(--muted-foreground);
    font-size: 0.875rem;
  }
</style>
