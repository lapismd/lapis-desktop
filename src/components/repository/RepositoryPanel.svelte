<script lang="ts">
  import { onMount, onDestroy, untrack } from "svelte";
  import * as ColumnCanvas from "@lapismd/design-core/shadcn/column-canvas";
  import { createLogCanvas } from "../../lib/repository/log-canvas.ts";
  import RepositoryLogHeader from "./RepositoryLogHeader.svelte";
  import type { HistoryController } from "../../lib/repository/history-controller.ts";
  import { initialHistoryState } from "../../lib/repository/history-state.ts";
  import RepositoryRevisions from "./RepositoryRevisions.svelte";
  import RepositoryDiffColumn from "./RepositoryDiffColumn.svelte";
  import RepositoryShell from "./RepositoryShell.svelte";
  let {
    controller,
    initialOperation,
    copyText,
  }: {
    controller: HistoryController;
    initialOperation?: string;
    copyText(value: string): Promise<void>;
  } = $props();
  let state = $state(initialHistoryState());
  const operations = $derived([
    ...new Set([...state.heads, ...(state.operation ? [state.operation] : [])]),
  ]);
  const canvas = createLogCanvas();
  onDestroy(() => void canvas.dispose());
  const selection = $derived(`${state.revision?.id ?? ""}/${state.path ?? ""}`);
  $effect(() => {
    selection;
    const revision = untrack(() => state.revision?.id);
    const path = untrack(() => state.path);
    untrack(() => {
      canvas.clear();
      if (revision) {
        canvas.select(0, revision);
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
    class="repository-panel"
    aria-label="Repository history"
    aria-busy={state.busy}
  >
    <div class="repository-columns">
      <ColumnCanvas.Root
        controller={canvas}
        aria-label="Repository history columns"
      >
        <ColumnCanvas.Column
          id="revisions"
          columnTitle="JJ Log"
          aria-label="Revisions"
        >
          <RepositoryLogHeader
            title="JJ Log"
            count={state.commits.length}
            {operations}
            operation={state.operation}
            busy={state.busy}
            onSelect={(operation) => controller.selectOperation(operation)}
            onRefresh={() => controller.refresh()}
          />
          <ColumnCanvas.Body>
            {#if state.phase === "loading"}<p role="status">
                Preparing repository history…
              </p>
            {:else if state.phase === "unavailable"}<p role="status">
                Repository history is unavailable for this vault. Refresh to try
                again.
              </p>
            {:else if !state.headsReady}<p role="status">
                Loading repository operations…
              </p>
            {:else if !state.operation}<p role="status">
                {state.heads.length > 1
                  ? "Choose an operation to inspect its history."
                  : "No repository operations available."}
              </p>
            {/if}

            {#if state.snapshot}
              <RepositoryRevisions
                {state}
                {controller}
                {copyText}
                onOpenDiff={() => canvas.open("diff")}
              />
            {/if}
          </ColumnCanvas.Body>
        </ColumnCanvas.Column>
        <RepositoryDiffColumn {state} {controller} />
      </ColumnCanvas.Root>
    </div>
  </section>
</RepositoryShell>

<style>
  .repository-panel {
    container: repository-history / inline-size;
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    color: var(--ui-workspace-view-foreground, var(--foreground));
    background: var(--ui-workspace-view-background, var(--background));
    font-size: 0.875rem;
  }
  p {
    margin: 0;
    padding: 1rem;
  }
  .repository-columns {
    display: block;
    width: 100%;
    min-width: 0;
    min-height: 0;
    flex: 1;
    overflow: hidden;
  }
</style>
