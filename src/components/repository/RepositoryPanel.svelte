<script lang="ts">
  import { onMount } from "svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import type { HistoryController } from "../../lib/repository/history-controller.ts";
  import {
    initialHistoryState,
    revisionLabel,
  } from "../../lib/repository/history-state.ts";
  import RepositoryRevisions from "./RepositoryRevisions.svelte";
  import RepositoryDiff from "./RepositoryDiff.svelte";
  let {
    controller,
    initialOperation,
  }: { controller: HistoryController; initialOperation?: string } = $props();
  let state = $state(initialHistoryState());
  const operations = $derived([
    ...new Set([...state.heads, ...(state.operation ? [state.operation] : [])]),
  ]);
  onMount(() => {
    const unsubscribe = controller.subscribe((value) => (state = value));
    void controller.refresh(initialOperation);
    return unsubscribe;
  });
</script>

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
      <RepositoryRevisions {state} {controller} />
      <section class="repository-comparison" aria-label="Revision changes">
        {#if state.revision}
          <h3>{revisionLabel(state.revision)}</h3>
          <code class="repository-id">{state.revision.id}</code>
          {#if state.revision.parents.length}
            <label
              >Compare with parent
              <select
                aria-label="Compare with parent"
                value={state.base ?? ""}
                onchange={(event) =>
                  controller.selectBase(event.currentTarget.value)}
              >
                <option value="" disabled>Choose a parent</option>
                {#each state.revision.parents as parent (parent)}<option
                    value={parent}>{parent}</option
                  >{/each}
              </select>
            </label>
          {:else}<p role="status">
              This revision has no parent comparison.
            </p>{/if}
          {#if state.base}
            <nav aria-label="Changed files">
              {#each state.paths as change (change.path)}
                <Button
                  variant="ghost"
                  size="sm"
                  aria-pressed={state.path === change.path}
                  onclick={() => controller.selectPath(change.path)}
                  >{change.path}</Button
                >
              {/each}
            </nav>
            {#if !state.pathsReady && !state.busy}<p role="status">
                File changes are unavailable.
              </p>
              <Button
                size="sm"
                onclick={() => controller.selectBase(state.base!)}
                >Retry comparison</Button
              >
            {:else if state.pathsReady && !state.paths.length && !state.busy}<p>
                No changed files in this comparison.
              </p>{/if}
            {#if state.nextPath}<Button
                size="sm"
                disabled={state.busy}
                onclick={() => controller.morePaths()}>More files</Button
              >{/if}
            {#if state.paths.length === 500}<p>
                Showing the first 500 changed files.
              </p>{/if}
          {/if}
          {#if state.diff}<RepositoryDiff change={state.diff} />
          {:else if state.path}{#if state.busy}<p role="status">
                Loading file changes…
              </p>{:else}<p role="status">File preview is unavailable.</p>
              <Button
                size="sm"
                onclick={() => controller.selectPath(state.path!)}
                >Retry preview</Button
              >{/if}{/if}
        {:else}<p>Select a revision to inspect its changes.</p>{/if}
      </section>
    </div>
  {/if}
</section>

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
  h2,
  h3 {
    font-size: 0.95rem;
    font-weight: 600;
    margin: 0;
  }
  h3 {
    padding-bottom: 0.5rem;
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
    display: grid;
    grid-template-columns: minmax(12rem, 30%) minmax(0, 1fr);
    min-height: 0;
    flex: 1;
    overflow: auto;
  }
  .repository-comparison {
    padding: 0.75rem;
    min-width: 0;
  }
  .repository-id {
    display: block;
    overflow-wrap: anywhere;
    font-size: 0.75rem;
    margin-bottom: 0.75rem;
  }
  nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    padding-block: 0.5rem;
  }
  @container repository-history (max-width: 640px) {
    .repository-columns {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
