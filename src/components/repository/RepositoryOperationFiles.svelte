<script lang="ts">
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
  }: {
    state: OperationState;
    controller: OperationController;
    onOpenDiff(): void;
    onOpenDetails(): void;
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
  <Button size="sm" variant="outline" onclick={onOpenDetails}
    >Inspect operation details</Button
  >
  {#if snapshot.detail?.status === "difference"}
    {#if !files.ready}
      <p role="status">
        {snapshot.busy
          ? "Loading operation revisions…"
          : "Operation revisions are unavailable."}
      </p>
      {#if !snapshot.busy}<Button
          size="sm"
          onclick={() => controller.files.retry()}>Retry revisions</Button
        >{/if}
    {:else if !files.groups.length}<p>
        No revision content changes in this operation.
      </p>
    {:else}
      <label
        >Changed revision
        <select
          aria-label="Changed revision"
          value={files.group?.change ?? ""}
          onchange={(event) =>
            controller.files.selectGroup(event.currentTarget.value)}
        >
          <option value="" disabled>Choose a changed revision</option>
          {#each files.groups as group (group.change)}<option
              value={group.change}>{group.change}</option
            >{/each}
        </select>
      </label>
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
  {:else if snapshot.selected?.parents.length === 0}<p>
      No file comparison for the root operation.
    </p>
  {:else if !snapshot.parent}<p>
      Choose a comparison parent in the operation card.
    </p>{/if}
</div>

<style>
  .operation-files {
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
  p {
    color: var(--muted-foreground);
  }
</style>
