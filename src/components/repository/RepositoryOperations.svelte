<script lang="ts">
  import { onMount, onDestroy, untrack } from "svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as ColumnCanvas from "@lapismd/design-core/shadcn/column-canvas";
  import type { OperationController } from "../../lib/repository/operation-controller.ts";
  import { initialOperationState } from "../../lib/repository/operation-state.ts";
  import { operationRows } from "../../lib/repository/graph/model.ts";
  import { createLogCanvas } from "../../lib/repository/log-canvas.ts";
  import RepositoryOperationFiles from "./RepositoryOperationFiles.svelte";
  import RepositoryDiffColumn from "./RepositoryDiffColumn.svelte";
  import RepositoryShell from "./RepositoryShell.svelte";
  import RepositoryGraph from "./RepositoryGraph.svelte";
  import RepositoryOperationDetail from "./RepositoryOperationDetail.svelte";
  let {
    controller,
    initialOperation,
    onHistory,
    copyText,
  }: {
    controller: OperationController;
    initialOperation?: string;
    onHistory(operation: string): void;
    copyText(value: string): Promise<void>;
  } = $props();
  let state = $state(initialOperationState());
  const pins = $derived([
    ...new Set([...state.heads, ...(state.operation ? [state.operation] : [])]),
  ]);
  const rows = $derived(operationRows(state.nodes));
  const selection = $derived(
    `${state.selected?.id ?? ""}/${state.files.path ?? ""}`,
  );
  const canvas = createLogCanvas(true);
  let selectedOperation: string | undefined;
  onDestroy(() => void canvas.dispose());
  $effect(() => {
    selection;
    const id = untrack(() => state.selected?.id);
    const path = untrack(() => state.files.path);
    untrack(() => {
      canvas.clear();
      if (id) {
        canvas.select(0, id);
      }
      if (id !== selectedOperation) {
        canvas.close("details");
        selectedOperation = id;
      }
      if (path) {
        canvas.select(1, path);
        canvas.open("diff");
      } else canvas.close("diff");
    });
  });
  onMount(() => {
    const unsubscribe = controller.subscribe((value) => (state = value));
    void controller.refresh(initialOperation);
    return unsubscribe;
  });
</script>

<RepositoryShell>
  <section
    class="repository-operations"
    aria-label="Repository operation log"
    aria-busy={state.busy}
  >
    <header>
      <h2>Op Log</h2>
      <Button
        size="sm"
        variant="outline"
        disabled={state.busy}
        onclick={() => controller.refresh()}>Refresh</Button
      >
    </header>
    <label class="operation-pin"
      >Pinned operation
      <select
        aria-label="Pinned operation"
        value={state.operation ?? ""}
        onchange={(event) => controller.selectPin(event.currentTarget.value)}
      >
        <option value="" disabled>Select an operation</option>
        {#each pins as pin (pin)}<option value={pin}>{pin}</option>{/each}
      </select>
    </label>
    {#if state.phase === "loading"}<p role="status">Preparing operation log…</p>
    {:else if state.phase === "unavailable"}<p role="status">
        Operation log is unavailable for this vault. Refresh to try again.
      </p>
    {:else if !state.headsReady}<p role="status">
        Loading repository operations…
      </p>
    {:else if !state.operation}<p role="status">
        {state.heads.length > 1
          ? "Choose an operation to inspect its ancestry."
          : "No repository operations available."}
      </p>{/if}
    {#if state.snapshot}
      <div class="operation-columns">
        <ColumnCanvas.Root
          controller={canvas}
          aria-label="Operation log columns"
        >
          <ColumnCanvas.Column
            id="revisions"
            title="Op Log"
            count={state.nodes.length}
            aria-label="Operations"
          >
            <ColumnCanvas.Body>
              {#if !state.ready && !state.busy}<p role="status">
                  Operations are unavailable. Refresh to try again.
                </p>
              {:else if state.ready && !state.nodes.length}<p>
                  No operations in this history.
                </p>{/if}
              <RepositoryGraph
                {copyText}
                commitLabel="operation ID"
                revisions={rows}
                selectedId={state.selected?.id}
                label="Operation graph"
                onSelect={(id) => {
                  const node = state.nodes.find((item) => item.id === id);
                  if (node)
                    void (state.selected?.id === id
                      ? controller.clearSelection()
                      : controller.select(node));
                }}
              >
                {#snippet selectedFiles()}<RepositoryOperationFiles
                    {state}
                    {controller}
                    onOpenDiff={() => canvas.open("diff")}
                    onOpenDetails={() => canvas.open("details")}
                  />{/snippet}
              </RepositoryGraph>
              {#if state.next}<Button
                  size="sm"
                  disabled={state.busy}
                  onclick={() => controller.more()}>More operations</Button
                >{/if}
              {#if state.nodes.length === 200}<p>
                  Showing the first 200 operations.
                </p>{/if}
            </ColumnCanvas.Body>
          </ColumnCanvas.Column>
          <ColumnCanvas.Column
            id="details"
            columnTitle="Operation details"
            aria-label="Operation details"
          >
            <ColumnCanvas.Header
              ><ColumnCanvas.Title>Operation details</ColumnCanvas.Title
              ><ColumnCanvas.Close
                aria-label="Close operation details column"
              /></ColumnCanvas.Header
            >
            <ColumnCanvas.Body
              ><RepositoryOperationDetail
                {state}
                {controller}
                {onHistory}
              /></ColumnCanvas.Body
            >
          </ColumnCanvas.Column>
          <RepositoryDiffColumn
            state={{ ...state.files, busy: state.busy }}
            controller={controller.files}
          />
        </ColumnCanvas.Root>
      </div>
    {/if}
  </section>
</RepositoryShell>

<style>
  .repository-operations {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    background: var(--ui-workspace-view-background, var(--background));
    color: var(--ui-workspace-view-foreground, var(--foreground));
    font-size: 0.875rem;
  }
  header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border);
  }
  h2 {
    font-size: 0.95rem;
    margin: 0;
  }
  .operation-pin {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
  }
  select {
    flex: 1;
    min-width: 0;
    max-width: 100%;
    padding: 0.375rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--foreground);
    background: var(--background);
  }
  .operation-columns {
    display: block;
    width: 100%;
    min-width: 0;
    min-height: 0;
    flex: 1;
    overflow: hidden;
  }
  p {
    padding: 0.75rem;
  }
</style>
