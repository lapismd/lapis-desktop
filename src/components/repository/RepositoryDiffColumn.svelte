<script lang="ts">
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
  }: {
    state: Pick<HistoryState, "path" | "diff" | "busy">;
    controller: { selectPath(path: string): Promise<void> };
  } = $props();
  let viewMode = $state<FileDiffViewMode>("unified");
  let wrap = $state(false);
  const stats = $derived(changeStats(snapshot.diff));
</script>

<ColumnCanvas.Column id="diff" columnTitle="Diff" aria-label="Revision changes">
  <ColumnCanvas.Header>
    <ColumnCanvas.Title>{snapshot.path ?? "Diff"}</ColumnCanvas.Title>
    <ColumnCanvas.HeaderActions>
      {#if stats}<FileChangeStats {...stats} showZero />{/if}
      <RepositoryDiffControls bind:viewMode bind:wrap />
      <ColumnCanvas.Close aria-label="Close Diff column" />
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
