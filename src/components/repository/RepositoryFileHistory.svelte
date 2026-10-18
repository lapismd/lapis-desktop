<script lang="ts">
  import { onMount } from "svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as ScrollArea from "@lapismd/design-core/shadcn/scroll-area";
  import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
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
  }: {
    controller: FileHistoryController;
    copyText(value: string): Promise<void>;
    onOpen(revision: string): void;
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
      aria-label="Refresh file history"
      disabled={!state?.path || state.busy}
      onclick={() => controller.refresh()}><RefreshCwIcon /></Button
    >
  </header>
  {#if state?.path && pins.length}<div class="file-pin">
      <RepositoryOperationPinPicker
        operations={pins}
        operation={state.operation}
        label="File history operation"
        onSelect={(id) => void controller.refresh(id)}
        {copyText}
      />
    </div>{/if}
  <ScrollArea.Root style="flex:1;min-height:0;min-width:0">
    {#if !state?.path}<p role="status">
        Open a file in the editor to see its revision history.
      </p>
    {:else}
      <RepositoryGraph
        revisions={rows}
        commits={state.commits}
        label="File revision graph"
        {copyText}
        onSelect={onOpen}
      />
      {#if state.busy}<p role="status">Loading file history…</p>
      {:else if state.phase === "unavailable"}<p role="status">
          File history is unavailable. Refresh to try again.
        </p>
      {:else if !state.operation}<p role="status">
          {state.heads.length > 1
            ? "Choose an operation to inspect this file."
            : "No repository history available."}
        </p>
      {:else if !state.commits.length}<p role="status">
          No revisions changed this file at the selected operation.
        </p>{/if}
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
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--border);
  }
  .file-title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
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
