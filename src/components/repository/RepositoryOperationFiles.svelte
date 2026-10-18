<script lang="ts">
  import RepositorySkeleton from "./RepositorySkeleton.svelte";
  import RepositoryRevisionPicker from "./RepositoryRevisionPicker.svelte";
  import UndoIcon from "@lucide/svelte/icons/undo-2";
  import InfoIcon from "@lucide/svelte/icons/info";
  import EllipsisIcon from "@lucide/svelte/icons/ellipsis";
  import CopyIcon from "@lucide/svelte/icons/copy";
  import * as Menu from "@lapismd/design-core/shadcn/dropdown-menu";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import type { OperationState } from "../../lib/repository/operation-state.ts";
  import type { OperationController } from "../../lib/repository/operation-controller.ts";
  import { listingFiles } from "../../lib/repository/history-files.ts";
  import RepositoryChangedFiles from "./RepositoryChangedFiles.svelte";
  let {
    state: snapshot,
    controller,
    onOpenDiff,
    onOpenDetails,
    copyText,
    commits,
    onHistory,
  }: {
    state: OperationState;
    onHistory?(): void;
    commits: import("@lapismd/jj-history").LocalGraphCommit[];
    controller: OperationController;
    onOpenDiff(): void;
    onOpenDetails(): void;
    copyText(value: string): Promise<void>;
  } = $props();
  const files = $derived(snapshot.files);
  const listing = $derived(listingFiles(files.paths, files.diff));
  let from = $state(""),
    to = $state("");
  const groupId = $derived(files.group?.change);
  $effect(() => {
    groupId;
    from = "";
    to = "";
  });
</script>

<div class="operation-files">
  <div
    class="repository-review-operation-actions"
    role="toolbar"
    aria-label="Selected operation actions"
  >
    <Button
      size="xs"
      variant="outline"
      aria-label="Inspect operation details"
      title="Inspect operation details"
      onclick={onOpenDetails}
      ><InfoIcon data-icon="inline-start" aria-hidden="true" />Inspect</Button
    >
    <RepositoryRevisionPicker
      onOpen={() => void controller.loadRevisions()}
      groups={files.groups}
      selected={files.group?.change}
      {commits}
      {copyText}
      disabled={!files.ready || !files.groups.length}
      onSelect={(id) => controller.files.selectGroup(id)}
    />
    <Button
      size="xs"
      variant="outline"
      disabled
      title="Operation revert is unavailable in this read-only repository plugin"
      ><UndoIcon data-icon="inline-start" aria-hidden="true" />Revert</Button
    >
    <span class="repository-review-operation-menu">
      <Menu.Root>
        <Menu.Trigger>
          {#snippet child({ props })}
            <Button
              {...props}
              variant="ghost"
              size="icon-xs"
              aria-label="More operation actions"
              ><EllipsisIcon aria-hidden="true" /></Button
            >
          {/snippet}
        </Menu.Trigger>
        <Menu.Content
          align="end"
          preventScroll={false}
          style="min-width: 12rem"
        >
          <Menu.Group>
            {#if onHistory}<Menu.Item onSelect={onHistory}
                >Open in JJ Log</Menu.Item
              >{/if}
            <Menu.Item
              onSelect={() => {
                if (snapshot.selected)
                  void copyText(snapshot.selected.id).catch(() => {});
              }}><CopyIcon aria-hidden="true" />Copy operation ID</Menu.Item
            >
          </Menu.Group>
        </Menu.Content>
      </Menu.Root>
    </span>
  </div>
  {#if snapshot.busy && !snapshot.detail}
    <RepositorySkeleton kind="operation" label="Loading operation details…" />
  {:else if snapshot.detail?.status === "difference"}
    {#if !files.ready}
      {#if snapshot.busy}<RepositorySkeleton
          kind="files"
          label="Loading operation revisions…"
        />
      {:else}<p role="status">Operation revisions are unavailable.</p>{/if}
      {#if !snapshot.busy}<Button
          size="sm"
          onclick={() => controller.files.retry()}>Retry revisions</Button
        >{/if}
    {:else if !files.groups.length}<p>
        No revision content changes in this operation.
      </p>
    {:else}
      {#if files.group?.comparison.status === "select"}
        <p>Choose both revisions for this comparison.</p>
        <label
          >Before revision<select aria-label="Before revision" bind:value={from}
            ><option value="" disabled>Choose before</option
            >{#each files.group.comparison.before as id (id)}<option value={id}
                >{id}</option
              >{/each}</select
          ></label
        >
        <label
          >After revision<select aria-label="After revision" bind:value={to}
            ><option value="" disabled>Choose after</option
            >{#each files.group.comparison.after as id (id)}<option value={id}
                >{id}</option
              >{/each}</select
          ></label
        >
        <Button
          size="sm"
          disabled={!from || !to || snapshot.busy}
          onclick={() => controller.files.compare(from, to)}
          >Compare revisions</Button
        >
      {:else if files.group?.comparison.status === "unavailable"}<p
          role="status"
        >
          This change has no available content comparison.
        </p>{/if}
      {#if files.from && files.to}
        {#if files.pathsReady || snapshot.busy}<RepositoryChangedFiles
            files={listing}
            selectedPath={files.path}
            initialLoading={!files.pathsReady && snapshot.busy}
            loading={snapshot.busy}
            hasMore={!!files.nextPath}
            onSelect={(path) => {
              onOpenDiff();
              void controller.files.selectPath(path);
            }}
            onMore={() => void controller.files.morePaths()}
          />{/if}
        {#if !files.pathsReady && !snapshot.busy}<p role="status">
            File changes are unavailable.
          </p>
          <Button size="sm" onclick={() => controller.files.retryPaths()}
            >Retry comparison</Button
          >
        {:else if files.pathsReady && !files.paths.length}<p>
            No changed files in this comparison.
          </p>{/if}
        {#if files.paths.length === 500}<p>
            Showing the first 500 changed files.
          </p>{/if}
      {/if}
      {#if files.next}<Button
          size="sm"
          disabled={snapshot.busy}
          onclick={() => controller.files.more()}>More changed revisions</Button
        >{/if}
      {#if files.groups.length === 500}<p>
          Showing the first 500 changed revisions.
        </p>{/if}
    {/if}
  {:else if snapshot.selected && snapshot.selected.parents.length > 0 && !snapshot.parent}<p
    >
      Choose a comparison parent in the operation card.
    </p>
  {:else if snapshot.selected && !snapshot.detail && !snapshot.busy}
    <p role="status">Operation changes are unavailable.</p>
    <Button
      size="sm"
      onclick={() =>
        snapshot.parent
          ? controller.selectParent(snapshot.parent)
          : controller.select(snapshot.selected!)}>Retry operation</Button
    >
  {/if}
</div>

<style>
  .operation-files {
    padding: 0 0.5rem 0.5rem;
    font-size: 0.8125rem;
  }
  .repository-review-operation-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    padding-inline-end: 0.5rem;
    margin: -0.5rem -0.5rem 0.5rem;
    border-block: 1px solid var(--border);
    background: color-mix(in srgb, var(--foreground) 4%, var(--background));
  }
  .repository-review-operation-menu {
    display: inline-flex;
    margin-inline-start: auto;
    --accent: color-mix(in srgb, var(--foreground) 24%, var(--background));
    --muted: var(--accent);
    --ui-column-canvas-header-action-hover: var(--accent);
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
  p {
    color: var(--muted-foreground);
  }
</style>
