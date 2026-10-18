<script lang="ts">
  import * as ColumnCanvas from "@lapismd/design-core/shadcn/column-canvas";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import {
    FileChangeStats,
    type FileDiffViewMode,
  } from "@lapismd/design-core/diff";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import FileSearchIcon from "@lucide/svelte/icons/file-search";
  import InfoIcon from "@lucide/svelte/icons/info";
  import type { OperationState } from "../../lib/repository/operation-state.ts";
  import type { OperationController } from "../../lib/repository/operation-controller.ts";
  import { changeStats } from "../../lib/repository/history-files.ts";
  import RepositoryOperationRail from "./RepositoryOperationRail.svelte";
  import RepositoryOperationDetail from "./RepositoryOperationDetail.svelte";
  import RepositoryDiff from "./RepositoryDiff.svelte";
  import RepositoryDiffControls from "./RepositoryDiffControls.svelte";
  import "./repository-operation-column.css";
  let {
    state: snapshot,
    controller,
    onHistory,
    copyText,
  }: {
    state: OperationState;
    controller: OperationController;
    onHistory(id: string): void;
    copyText(value: string): Promise<void>;
  } = $props();
  let expanded = $state(true),
    nativeDetails = $state(false);
  let viewMode = $state<FileDiffViewMode>("unified"),
    wrap = $state(false);
  const stats = $derived(changeStats(snapshot.files.diff));
  const panelId = $derived(
    `operation-metadata-${snapshot.selected?.id ?? "none"}`,
  );
  const operationId = $derived(snapshot.selected?.id);
  $effect(() => {
    operationId;
    expanded = true;
    nativeDetails = false;
  });
</script>

<ColumnCanvas.Column
  id="diff"
  columnTitle="Diff"
  aria-label="Revision changes"
  style="border:0;border-radius:0;background:transparent"
>
  <ColumnCanvas.Body>
    <div class="operation-diff-stack">
      {#if snapshot.selected}
        <section class="operation-card" aria-label="Selected operation">
          <header class="operation-card-header">
            <button
              class="operation-toggle"
              type="button"
              aria-expanded={expanded}
              aria-controls={panelId}
              onclick={() => (expanded = !expanded)}
            >
              <ChevronDownIcon aria-hidden="true" />
              <span>{snapshot.selected.description || "No description"}</span>
            </button>
            <div class="operation-card-actions">
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Inspect native operation changes"
                title="Inspect native operation changes"
                aria-expanded={nativeDetails}
                onclick={() => (nativeDetails = !nativeDetails)}
                ><InfoIcon /></Button
              >
              <ColumnCanvas.Close
                aria-label="Close Diff column"
                title="Close Diff"
              />
            </div>
          </header>
          {#if expanded}
            <div id={panelId}>
              <RepositoryOperationRail
                operation={snapshot.selected}
                onSelect={(id) => void controller.selectId(id)}
                {copyText}
              />
              {#if snapshot.selected.parents.length > 1}
                <label class="operation-parent-comparison"
                  >Compare with parent
                  <select
                    aria-label="Compare operation with parent"
                    value={snapshot.parent ?? ""}
                    onchange={(event) =>
                      controller.selectParent(event.currentTarget.value)}
                  >
                    <option value="" disabled>Choose a parent</option>
                    {#each snapshot.selected.parents as parent (parent)}<option
                        value={parent}>{parent}</option
                      >{/each}
                  </select>
                </label>
                {#if !snapshot.parent}<p class="operation-parent-hint">
                    Choose a parent to compare this operation.
                  </p>{/if}
              {/if}
            </div>
          {/if}
          {#if nativeDetails}<RepositoryOperationDetail
              state={snapshot}
              {controller}
              {onHistory}
            />{/if}
        </section>
      {/if}
      <section class="operation-file-card" aria-label="Selected file diff">
        {#if snapshot.files.path}
          <header class="operation-card-header">
            <span class="operation-file-path">{snapshot.files.path}</span>
            <div class="operation-card-actions">
              {#if stats}<FileChangeStats {...stats} showZero />{/if}
              <RepositoryDiffControls bind:viewMode bind:wrap />
            </div>
          </header>
          {#if snapshot.files.diff}<RepositoryDiff
              compact
              change={snapshot.files.diff}
              {viewMode}
              {wrap}
            />
          {:else if snapshot.busy}<div
              class="operation-diff-loading"
              role="status"
              aria-label="Loading selected operation comparison"
            >
              <Skeleton style="height:1rem;width:75%" /><Skeleton
                style="height:1rem;width:90%"
              /><Skeleton style="height:1rem;width:60%" />
            </div>
          {:else}<Empty.Root class="operation-diff-empty" role="status"
              ><Empty.Header
                ><Empty.Media variant="icon"><FileSearchIcon /></Empty.Media
                ><Empty.Title style="font-size:0.875rem;color:var(--foreground)"
                  >File preview is unavailable</Empty.Title
                ><Empty.Description style="font-size:0.75rem;max-width:28rem"
                  >Retry the selected file comparison.</Empty.Description
                ></Empty.Header
              ><Button
                size="sm"
                onclick={() =>
                  controller.files.selectPath(snapshot.files.path!)}
                >Retry preview</Button
              ></Empty.Root
            >{/if}
        {:else}
          <Empty.Root class="operation-diff-empty" role="status">
            <Empty.Header
              ><Empty.Media variant="icon"
                ><FileSearchIcon aria-hidden="true" /></Empty.Media
              ><Empty.Title style="font-size:0.875rem;color:var(--foreground)"
                >No file selected</Empty.Title
              ><Empty.Description style="font-size:0.75rem;max-width:28rem"
                >Select a changed file to preview the operation diff.</Empty.Description
              ></Empty.Header
            >
          </Empty.Root>
        {/if}
      </section>
    </div>
  </ColumnCanvas.Body>
</ColumnCanvas.Column>
