<script lang="ts">
  import RepositorySkeleton from "./RepositorySkeleton.svelte";
  import { onMount } from "svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as ScrollArea from "@lapismd/design-core/shadcn/scroll-area";
  import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
  import GitMergeConflictIcon from "@lucide/svelte/icons/git-merge-conflict";
  import FileClockIcon from "@lucide/svelte/icons/file-clock";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import type {
    FileHistoryController,
    FileHistoryState,
  } from "../../lib/repository/file-history-controller.ts";
  import { commitRows } from "../../lib/repository/graph/model.ts";
  import RepositoryGraph from "./RepositoryGraph.svelte";
  import RepositoryFileTitle from "./RepositoryFileTitle.svelte";
  import RepositoryOperationPinPicker from "./RepositoryOperationPinPicker.svelte";
  let {
    controller,
    copyText,
    onOpen,
    onBlame,
  }: {
    controller: FileHistoryController;
    copyText(value: string): Promise<void>;
    onOpen(revision: string): void;
    onBlame(): void;
  } = $props();
  let state = $state<FileHistoryState>();
  const rows = $derived(commitRows(state?.commits ?? []));
  const pins = $derived([
    ...new Set([
      ...(state?.heads ?? []),
      ...(state?.operation ? [state.operation] : []),
    ]),
  ]);
  onMount(() =>
    controller.subscribe((value) => {
      state = value;
    }),
  );
</script>

<section
  class="file-history"
  aria-label="Active file history"
  aria-busy={state?.busy ?? false}
>
  <header>
    <span class="file-title"
      >{#if state?.path}<RepositoryFileTitle path={state.path} />{:else}File
        history{/if}</span
    >
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Blame file"
      title="Blame file"
      disabled={!state?.path || !state.workspaceCommit || state.busy}
      onclick={onBlame}><GitMergeConflictIcon /></Button
    >
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Refresh file history"
      disabled={!state?.path || state.busy}
      onclick={() => controller.refresh()}><RefreshCwIcon /></Button
    >
  </header>
  {#if state?.path && !state.operation && pins.length > 1}<div class="file-pin">
      <RepositoryOperationPinPicker
        operations={pins}
        operation={state.operation}
        label="File history operation"
        onSelect={(id) => void controller.refresh(id)}
        {copyText}
      />
    </div>{/if}
  <ScrollArea.Root style="flex:1;min-height:0;min-width:0">
    {#if !state?.path}<Empty.Root role="status">
        <Empty.Header>
          <Empty.Media variant="icon"><FileClockIcon /></Empty.Media>
          <Empty.Title>No file selected</Empty.Title>
          <Empty.Description
            >Open a file in the editor to see its revision history.</Empty.Description
          >
        </Empty.Header>
      </Empty.Root>
    {:else}
      <RepositoryGraph
        revisions={rows}
        commits={state.commits}
        label="File revision graph"
        {copyText}
        showAuthor={false}
        onSelect={onOpen}
      />
      {#if state.busy}<RepositorySkeleton
          kind="file-history"
          label="Loading file history…"
        />
      {:else if state.phase === "unavailable"}<p role="status">
          File history is unavailable. Refresh to try again.
        </p>
      {:else if !state.operation}<p role="status">
          {state.heads.length > 1
            ? "Choose an operation to inspect this file."
            : "No repository history available."}
        </p>
      {:else if !state.commits.length}<Empty.Root role="status">
          <Empty.Header>
            <Empty.Media variant="icon"><FileClockIcon /></Empty.Media>
            <Empty.Title>No file history</Empty.Title>
            <Empty.Description
              >No revisions changed this file at the selected operation.</Empty.Description
            >
          </Empty.Header>
        </Empty.Root>{/if}
      {#if state.next}<Button
          variant="outline"
          size="sm"
          disabled={state.busy}
          onclick={() => controller.more()}>More revisions</Button
        >{/if}
      {#if state.commits.length === 200}<p role="status">
          Showing the first 200 matching revisions.
        </p>{/if}
    {/if}
  </ScrollArea.Root>
</section>

<style>
  .file-history {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    min-width: 0;
    color: var(--foreground);
    background: var(--background);
    font-size: 0.8125rem;
  }
  header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-sizing: border-box;
    height: var(--ui-workspace-tab-height, 40px);
    min-height: var(--ui-workspace-tab-height, 40px);
    flex: 0 0 var(--ui-workspace-tab-height, 40px);
    padding: 0 0.75rem;
    border-bottom: 1px solid var(--border);
  }
  .file-title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    font-size: 0.875rem;
  }
  .file-pin {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--border);
  }
  p {
    padding: 0.75rem;
    margin: 0;
    color: var(--muted-foreground);
    line-height: 1.5;
  }
</style>
