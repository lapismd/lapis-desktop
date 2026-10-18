<script lang="ts">
  import { onMount, onDestroy, untrack } from "svelte";
  import * as ColumnCanvas from "@lapismd/design-core/shadcn/column-canvas";
  import { createLogCanvas } from "../../lib/repository/log-canvas.ts";
  import { Button } from "@lapismd/design-core/shadcn/button";
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
    <header class="repository-toolbar">
      <h2>Repository history</h2>
      <Button
        size="sm"
        variant="outline"
        disabled={state.busy}
        onclick={() => controller.refresh()}>Refresh</Button
      >
    </header>
    <label class="repository-operation"
      >Operation
      <select
        aria-label="Operation"
        value={state.operation ?? ""}
        onchange={(event) =>
          controller.selectOperation(event.currentTarget.value)}
      >
        <option value="" disabled>Select an operation</option>
        {#each operations as operation (operation)}<option value={operation}
            >{operation}</option
          >{/each}
      </select>
    </label>
    {#if state.operation}<p class="repository-pin">
        Pinned operation <code>{state.operation}</code>
      </p>{/if}
    {#if state.phase === "loading"}<p role="status">
        Preparing repository history…
      </p>
    {:else if state.phase === "unavailable"}<p role="status">
        Repository history is unavailable for this vault. Refresh to try again.
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
      <div class="repository-columns">
        <ColumnCanvas.Root
          controller={canvas}
          aria-label="Repository history columns"
        >
          <ColumnCanvas.Column
            id="revisions"
            title="JJ Log"
            count={state.commits.length}
            aria-label="Revisions"
          >
            <ColumnCanvas.Body
              ><RepositoryRevisions
                {state}
                {controller}
                {copyText}
                onOpenDiff={() => canvas.open("diff")}
              /></ColumnCanvas.Body
            >
          </ColumnCanvas.Column>
          <RepositoryDiffColumn {state} {controller} />
        </ColumnCanvas.Root>
      </div>
    {/if}
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
  .repository-toolbar {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border);
    gap: 0.5rem;
  }
  h2 {
    font-size: 0.95rem;
    font-weight: 600;
    margin: 0;
  }
  label {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }
  select {
    min-width: 0;
    max-width: 100%;
    flex: 1;
    padding: 0.375rem;
    color: var(--foreground);
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .repository-operation {
    padding: 0.75rem 1rem 0.25rem;
  }
  .repository-pin {
    margin: 0.5rem 1rem;
    font-size: 0.75rem;
    color: var(--muted-foreground);
    overflow-wrap: anywhere;
  }
  .repository-pin code {
    display: block;
  }
  .repository-panel > p:not(.repository-pin) {
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
