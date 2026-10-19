<script lang="ts">
  // Adapted from jj-store's CommunitySearchCommand result and input composition.
  import HistorySearchResults from "./HistorySearchResults.svelte";
  import { onMount } from "svelte";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import Search from "@lucide/svelte/icons/search";
  import RepositoryShell from "../RepositoryShell.svelte";
  import RepositoryRestoreDialog from "../RepositoryRestoreDialog.svelte";
  import type { RestoreController } from "../../../lib/repository/restore.ts";
  import type { HistorySearchController } from "../../../lib/repository/search-controller.ts";
  import {
    initialSearchState,
    type HistorySearchHit,
  } from "../../../lib/repository/search.ts";
  let {
    controller,
    restore,
    onOpen,
  }: {
    controller: HistorySearchController;
    restore?: RestoreController;
    onOpen(hit: HistorySearchHit): Promise<void>;
  } = $props();
  let snapshot = $state(initialSearchState());
  let text = $state(""),
    path = $state(""),
    author = $state(""),
    from = $state(""),
    to = $state("");
  let selected = $state<HistorySearchHit>();
  let opening = $state(false);
  onMount(() => controller.subscribe((value) => (snapshot = value)));
  function search() {
    selected = undefined;
    return controller.search({
      text,
      path: path || undefined,
      author: author || undefined,
      from_millis: from ? new Date(`${from}T00:00:00`).getTime() : undefined,
      to_millis: to ? new Date(`${to}T23:59:59.999`).getTime() : undefined,
    });
  }
  async function open(hit: HistorySearchHit) {
    opening = true;
    try {
      await onOpen(hit);
    } finally {
      opening = false;
    }
  }
</script>

<RepositoryShell>
  <section
    class="history-search"
    aria-label="Search vault history"
    aria-busy={snapshot.busy}
  >
    <form
      onsubmit={(e) => {
        e.preventDefault();
        void search();
      }}
    >
      <div class="search-input">
        <Search size={16} aria-hidden="true" />
        <Input
          aria-label="Search history"
          bind:value={text}
          placeholder="Search saved text, paths and checkpoints"
        />
        <Button type="submit" size="sm">Search</Button>
      </div>
      <div class="search-filters">
        <label
          >Path<Input
            aria-label="History path filter"
            bind:value={path}
            placeholder="e.g. Projects/"
          /></label
        >
        <label
          >Author<Input
            aria-label="History author filter"
            bind:value={author}
            placeholder="Name or email"
          /></label
        >
        <label
          >From<Input
            type="date"
            aria-label="History from date"
            bind:value={from}
          /></label
        >
        <label
          >To<Input
            type="date"
            aria-label="History to date"
            bind:value={to}
          /></label
        >
      </div>
    </form>
    {#if selected}<div class="search-actions">
        <span
          >{selected.path ??
            selected.revision.checkpoint.description.split("\n")[0]}</span
        >
        <Button
          variant="outline"
          size="sm"
          disabled={opening}
          onclick={() => open(selected!)}
          >{selected.path ? "Open version" : "Open checkpoint"}</Button
        >
        {#if restore}<Button
            variant="outline"
            size="sm"
            onclick={() =>
              selected?.path
                ? restore.prepare(
                    selected.revision.checkpoint.commit,
                    selected.path,
                  )
                : restore.prepareVault(selected!.revision.checkpoint.commit)}
            >Restore {selected.path ? "file" : "checkpoint"}</Button
          >{/if}
      </div>{/if}
    <HistorySearchResults {snapshot} onSelect={(hit) => (selected = hit)} />
    {#if snapshot.searched || snapshot.busy}<footer>
        <span role="status"
          >{snapshot.busy
            ? "Searching saved history…"
            : `${snapshot.checkpoints} checkpoints searched${snapshot.next ? " · older history available" : " · complete"}`}</span
        >
        {#if snapshot.next}<Button
            variant="outline"
            size="sm"
            disabled={snapshot.busy}
            onclick={() => controller.more()}>Search older history</Button
          >{/if}
        {#if snapshot.unindexed}<span
            >{snapshot.unindexed} file versions indexed by path only (binary, conflicted,
            symlink or over 1 MiB).</span
          >{/if}
      </footer>{/if}
  </section>
  {#if restore}<RepositoryRestoreDialog controller={restore} />{/if}
</RepositoryShell>

<style>
  .history-search {
    display: flex;
    flex: 1;
    min-height: 0;
    min-width: 0;
    flex-direction: column;
    background: var(--background);
  }
  form {
    padding: 1rem;
    border-bottom: 1px solid var(--border);
  }
  .search-input {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .search-filters {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-top: 0.75rem;
  }
  label {
    flex: 1;
    min-width: 8rem;
    font-size: 0.75rem;
    color: var(--muted-foreground);
    display: grid;
    gap: 0.3rem;
  }
  .search-actions,
  footer {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.65rem 1rem;
    flex-wrap: wrap;
    font-size: 0.75rem;
    background: var(--muted);
  }
  .search-actions span {
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    min-width: 0;
  }
  footer {
    margin-top: auto;
  }
</style>
