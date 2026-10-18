<script lang="ts">
  import RepositoryFileTitle from "./RepositoryFileTitle.svelte";
  import {
    FileChangeStats,
    type FileDiffViewMode,
  } from "@lapismd/design-core/diff";
  import * as ColumnCanvas from "@lapismd/design-core/shadcn/column-canvas";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import type { HistoryState } from "../../lib/repository/history-state.ts";

  import { changeStats } from "../../lib/repository/history-files.ts";
  import RepositoryDiffControls from "./RepositoryDiffControls.svelte";
  import RepositoryDiff from "./RepositoryDiff.svelte";
  let {
    state: snapshot,
    controller,
    columnId = "diff",
    label = "Revision changes",
    closeLabel = "Close Diff column",
  }: {
    state: Pick<HistoryState, "path" | "diff" | "busy">;
    controller: { selectPath(path: string): Promise<void> };
    columnId?: string;
    label?: string;
    closeLabel?: string;
  } = $props();
  let viewMode = $state<FileDiffViewMode>("split");
  let wrap = $state(false);
  const stats = $derived(changeStats(snapshot.diff));
</script>

<ColumnCanvas.Column id={columnId} columnTitle="Diff" aria-label={label}>
  <ColumnCanvas.Header>
    <ColumnCanvas.Title
      ><RepositoryFileTitle path={snapshot.path} /></ColumnCanvas.Title
    >
    <ColumnCanvas.HeaderActions class="repository-review-column-actions">
      {#if stats}<FileChangeStats {...stats} showZero />{/if}
      <RepositoryDiffControls bind:viewMode bind:wrap />
      <ColumnCanvas.Close aria-label={closeLabel} />
    </ColumnCanvas.HeaderActions>
  </ColumnCanvas.Header>
  <ColumnCanvas.Body orientation="both">
    {#if snapshot.diff}<RepositoryDiff
        change={snapshot.diff}
        {viewMode}
        {wrap}
      />
    {:else if snapshot.path}{#if snapshot.busy}<p role="status">
          Loading file changes…
        </p>{:else}<p role="status">File preview is unavailable.</p>
        <Button size="sm" onclick={() => controller.selectPath(snapshot.path!)}
          >Retry preview</Button
        >{/if}
    {:else}<p role="status">Select a changed file to preview the diff.</p>{/if}
  </ColumnCanvas.Body>
</ColumnCanvas.Column>

<style>
  p {
    padding: 1rem;
    color: var(--muted-foreground);
    font-size: 0.875rem;
  }
</style>
