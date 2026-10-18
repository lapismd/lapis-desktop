<script lang="ts">
  import { onMount, onDestroy, untrack } from "svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import RepositoryLogHeader from "./RepositoryLogHeader.svelte";
  import * as ColumnCanvas from "@lapismd/design-core/shadcn/column-canvas";
  import type { OperationController } from "../../lib/repository/operation-controller.ts";
  import { initialOperationState } from "../../lib/repository/operation-state.ts";
  import { operationRows } from "../../lib/repository/graph/model.ts";
  import { createLogCanvas } from "../../lib/repository/log-canvas.ts";
  import RepositoryOperationFiles from "./RepositoryOperationFiles.svelte";
  import RepositoryOperationColumn from "./RepositoryOperationColumn.svelte";
  import RepositoryShell from "./RepositoryShell.svelte";
  import RepositoryGraph from "./RepositoryGraph.svelte";
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
  const canvas = createLogCanvas();
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
      if (id && id !== selectedOperation) canvas.open("diff");
      selectedOperation = id;
      if (path) {
        canvas.select(1, path);
        canvas.open("diff");
      } else if (!id) canvas.close("diff");
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
    <div class="operation-columns">
      <ColumnCanvas.Root controller={canvas} aria-label="Operation log columns">
        <ColumnCanvas.Column
          id="revisions"
          columnTitle="Op Log"
          aria-label="Operations"
        >
          <RepositoryLogHeader
            title="Op Log"
            count={state.nodes.length}
            operations={pins}
            operation={state.operation}
            selectionLabel="Pinned operation"
            busy={state.busy}
            onSelect={(operation) => controller.selectPin(operation)}
            onRefresh={() => controller.refresh()}
          />
          <ColumnCanvas.Body>
            {#if state.phase === "loading"}<p role="status">
                Preparing operation log…
              </p>
            {:else if state.phase === "unavailable"}<p role="status">
                Operation log is unavailable for this vault. Refresh to try
                again.
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
              {#if state.selected && !state.nodes.some((node) => node.id === state.selected?.id)}
                <section aria-label="Selected operation outside loaded graph">
                  <p>The selected operation is outside this graph page.</p>
                  <RepositoryOperationFiles
                    {state}
                    {controller}
                    onOpenDiff={() => canvas.open("diff")}
                    onOpenDetails={() => canvas.open("diff")}
                  />
                </section>
              {/if}
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
                    onOpenDetails={() => canvas.open("diff")}
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
            {/if}
          </ColumnCanvas.Body>
        </ColumnCanvas.Column>
        <RepositoryOperationColumn
          {state}
          {controller}
          {onHistory}
          {copyText}
        />
      </ColumnCanvas.Root>
    </div>
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
