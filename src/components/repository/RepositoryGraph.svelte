<script lang="ts">
  import type { Snippet } from "svelte";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import type { RepositoryLogRevision } from "../../lib/repository/graph/model.ts";
  import {
    buildRepositoryLogGraph,
    repositoryLogSvgWidth,
  } from "../../lib/repository/graph/repository-log-graph.ts";
  import { timestampLabel } from "../../lib/repository/history-state.ts";
  import RepositoryGraphSvg from "./RepositoryGraphSvg.svelte";
  import RepositoryIdentifiers from "./RepositoryIdentifiers.svelte";
  let {
    revisions,
    selectedId,
    label = "Revision graph",
    commitLabel = "commit ID",
    onSelect,
    copyText,
    selectedFiles,
  }: {
    revisions: RepositoryLogRevision[];
    selectedId?: string;
    label?: string;
    commitLabel?: string;
    onSelect(id: string): void;
    copyText(value: string): Promise<void>;
    selectedFiles?: Snippet;
  } = $props();
  const rows = $derived(buildRepositoryLogGraph(revisions));
  const width = $derived(repositoryLogSvgWidth(rows));
  let heights = $state<Record<string, number>>({});
  function measure(node: HTMLElement, id: string) {
    const observer = new ResizeObserver(() => {
      const height = node.getBoundingClientRect().height;
      if (heights[id] !== height) heights[id] = height;
    });
    observer.observe(node);
    return { destroy: () => observer.disconnect() };
  }
</script>

<ol class="repository-graph" aria-label={label}>
  {#each rows as row (row.revision.eventId)}
    <li
      class:selected={selectedId === row.revision.eventId}
      use:measure={`graph:${row.revision.eventId}`}
    >
      <div
        class="repository-graph-row"
        style:padding-left={`${width}px`}
        use:measure={`row:${row.revision.eventId}`}
      >
        <RepositoryGraphSvg
          {row}
          {width}
          rowHeight={heights[`row:${row.revision.eventId}`] ?? 76}
          graphHeight={heights[`graph:${row.revision.eventId}`] ?? 76}
        />
        <button
          class="repository-graph-select"
          aria-pressed={selectedId === row.revision.eventId}
          aria-expanded={selectedFiles
            ? selectedId === row.revision.eventId
            : undefined}
          onclick={() => onSelect(row.revision.eventId)}
        >
          <span class="repository-author" aria-hidden="true"
            >{row.revision.author.slice(0, 2).toUpperCase() || "?"}</span
          >
          <span class="repository-graph-copy"
            ><strong>{row.revision.message}</strong>
            <span class="repository-graph-meta"
              >{row.revision.author}{row.revision.host
                ? `@${row.revision.host}`
                : ""} · {timestampLabel(row.revision.millis)}</span
            >
            <span class="repository-graph-tags">
              {#if row.revision.reason === "merge"}<Badge variant="secondary"
                  >Merge</Badge
                >{/if}
              {#if row.revision.conflicted}<Badge variant="destructive"
                  >Conflicted revision</Badge
                >{/if}
              {#each row.revision.tags as tag, index (index)}<Badge
                  variant="secondary">{tag}</Badge
                >{/each}
            </span>
          </span>
        </button>
        <RepositoryIdentifiers
          {copyText}
          changeId={row.changeIdEncoded}
          commitId={row.revision.eventId}
          {commitLabel}
          placement="inline"
        />
      </div>
      {#if selectedId === row.revision.eventId && selectedFiles}<div
          class="repository-inline-files"
        >
          {@render selectedFiles()}
        </div>{/if}
    </li>
  {/each}
</ol>

<style>
  .repository-graph {
    list-style: none;
    margin: 0;
    padding: 0;
    min-width: 0;
  }
  .repository-graph-row {
    position: relative;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    box-sizing: border-box;
    min-height: 76px;
    width: 100%;
    border-bottom: 1px solid var(--border);
    padding: 0.5rem;
  }
  .repository-graph-row:hover {
    background: color-mix(in srgb, var(--foreground) 7%, var(--background));
  }
  .selected {
    background: color-mix(in srgb, var(--foreground) 12%, var(--background));
  }
  .repository-graph-select {
    display: flex;
    align-items: center;
    flex: 1 1 12rem;
    gap: 0.5rem;
    padding: 0;
    min-width: 0;
    border: 0;
    text-align: left;
    font: inherit;
    color: inherit;
    background: transparent;
    cursor: pointer;
  }
  .repository-graph-select:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
  .repository-author {
    display: grid;
    place-items: center;
    width: 1.75rem;
    height: 1.75rem;
    flex-shrink: 0;
    border-radius: 50%;
    background: var(--muted);
    font-size: 0.65rem;
  }
  .repository-graph-copy {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    gap: 0.25rem;
  }
  strong {
    font-size: 0.875rem;
    font-weight: 500;
    overflow-wrap: anywhere;
  }
  .repository-graph-meta {
    font-size: 0.75rem;
    color: var(--muted-foreground);
    overflow-wrap: anywhere;
  }
  .repository-graph-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  .repository-inline-files {
    padding-top: 0.5rem;
  }
</style>
