<script lang="ts">
  import RepositoryFileTitle from "./RepositoryFileTitle.svelte";
  import * as ColumnCanvas from "@lapismd/design-core/shadcn/column-canvas";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import RepositorySkeleton from "./RepositorySkeleton.svelte";
  import {
    FileChangeStats,
    type FileDiffViewMode,
  } from "@lapismd/design-core/diff";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import FileSearchIcon from "@lucide/svelte/icons/file-search";
  import type { OperationState } from "../../lib/repository/operation-state.ts";
  import type { OperationController } from "../../lib/repository/operation-controller.ts";
  import { changeStats } from "../../lib/repository/history-files.ts";
  import RepositoryOperationParentPicker from "./RepositoryOperationParentPicker.svelte";
  import RepositoryOperationRail from "./RepositoryOperationRail.svelte";
  import RepositoryOperationArguments from "./RepositoryOperationArguments.svelte";
  import RepositoryOperationMessage from "./RepositoryOperationMessage.svelte";
  import RepositoryDiff from "./RepositoryDiff.svelte";
  import RepositoryDiffControls from "./RepositoryDiffControls.svelte";
  import "./repository-operation-column.css";
  let {
    state: snapshot,
    controller,
    copyText,
  }: {
    state: OperationState;
    controller: OperationController;
    copyText(value: string): Promise<void>;
  } = $props();
  let expanded = $state(true);
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
  });
</script>

<ColumnCanvas.Column
  id="diff"
  columnTitle="Diff"
  aria-label="Revision changes"
  style="border:0;border-radius:0;background:transparent"
>
  <ColumnCanvas.Body>
    <div class="operation-diff-stack" data-view-mode={viewMode}>
      {#if snapshot.selected}
        <section class="operation-card" aria-label="Selected operation">
          <header class="operation-card-header">
            <button
              class="operation-toggle"
              type="button"
              aria-expanded={expanded}
              aria-controls={panelId}
              aria-label={expanded
                ? "Collapse operation details"
                : "Expand operation details"}
              style="flex:none;padding:0.25rem"
              onclick={() => (expanded = !expanded)}
            >
              <ChevronDownIcon aria-hidden="true" />
            </button>
            <RepositoryOperationMessage
              message={snapshot.selected.description || "No description"}
              {copyText}
              onSelect={() => (expanded = !expanded)}
            />
            <div class="operation-card-actions">
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
              {#if snapshot.selected.parents.length > 0}
                <RepositoryOperationParentPicker
                  {copyText}
                  parents={snapshot.selected.parents}
                  nodes={[...snapshot.nodes, ...snapshot.parentNodes]}
                  target={snapshot.parent}
                  loading={snapshot.busy}
                  onOpen={() => void controller.loadParents()}
                  onSelect={(id) => void controller.selectParent(id)}
                />
                {#if !snapshot.parent}<p class="operation-parent-hint">
                    Choose a parent to compare this operation.
                  </p>{/if}
              {/if}
              <RepositoryOperationArguments
                attributes={snapshot.selected.attributes}
              />
            </div>
          {/if}
        </section>
      {/if}
      <section class="operation-file-card" aria-label="Selected file diff">
        {#if snapshot.files.path}
          <header class="operation-card-header">
            <span class="operation-file-path"
              ><RepositoryFileTitle path={snapshot.files.path} /></span
            >
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
          {:else if snapshot.busy}<RepositorySkeleton
              kind="diff"
              label="Loading selected operation comparison"
            />
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
