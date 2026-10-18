<script lang="ts">
  import type { Snippet } from "svelte";
  import type { LocalGraphCommit } from "@lapismd/jj-history";
  import RepositoryAuthorAvatar from "./RepositoryAuthorAvatar.svelte";
  import RepositoryOperationMessage from "./RepositoryOperationMessage.svelte";
  import { TagList } from "@lapismd/design-core/shadcn/tag-list";
  import { repositoryGraphTags } from "../../lib/repository/tags.ts";
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
    commits = [],
    selectedId,
    label = "Revision graph",
    commitLabel = "commit ID",
    onSelect,
    copyText,
    selectedFiles,
    operationTitles = false,
    onCopyError,
    showAuthor = true,
  }: {
    revisions: RepositoryLogRevision[];
    commits?: readonly LocalGraphCommit[];
    selectedId?: string;
    label?: string;
    commitLabel?: string;
    onSelect(id: string): void;
    copyText(value: string): Promise<void>;
    selectedFiles?: Snippet;
    operationTitles?: boolean;
    onCopyError?(error: unknown): void;
    showAuthor?: boolean;
  } = $props();
  const id = $props.id();
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
  function selectRow(event: MouseEvent, id: string) {
    const target = event.target;
    if (
      event.defaultPrevented ||
      !(target instanceof Element) ||
      target.closest(
        'button, a, input, select, textarea, [role="button"], [role="combobox"], [contenteditable="true"]',
      )
    )
      return;
    onSelect(id);
  }
</script>

<ol class="repository-graph" aria-label={label}>
  {#each rows as row (row.revision.eventId)}
    {@const commit = commits.find(
      (commit) => commit.id === row.revision.eventId,
    )}
    {@const tags = repositoryGraphTags(row.revision, commit)}
    {@const tagsId = `${id}-tags-${row.revision.eventId}`}
    <li
      class:selected={selectedId === row.revision.eventId}
      use:measure={`graph:${row.revision.eventId}`}
    >
      <!-- Existing selection button owns keyboard input; extend only its pointer hit area. -->
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div
        class="repository-graph-row"
        style:padding-left={`${width}px`}
        use:measure={`row:${row.revision.eventId}`}
        onclick={(event) => selectRow(event, row.revision.eventId)}
      >
        <RepositoryGraphSvg
          {row}
          {width}
          rowHeight={heights[`row:${row.revision.eventId}`] ?? 76}
          graphHeight={heights[`graph:${row.revision.eventId}`] ?? 76}
        />
        {#if showAuthor}<RepositoryAuthorAvatar
            name={row.revision.author}
            email={commit?.author.email}
            handle={row.revision.host
              ? `${row.revision.author}@${row.revision.host}`
              : undefined}
            size="md"
          />{/if}
        <div class="repository-graph-copy">
          {#if operationTitles}<RepositoryOperationMessage
              message={row.revision.message}
              {copyText}
              {onCopyError}
              onSelect={() => onSelect(row.revision.eventId)}
            />{/if}
          <button
            class="repository-graph-select"
            aria-label={operationTitles
              ? `${row.revision.message}; ${row.revision.author}${row.revision.host ? `@${row.revision.host}` : ""} · ${timestampLabel(row.revision.millis)}`
              : undefined}
            aria-pressed={selectedId === row.revision.eventId}
            aria-describedby={tags.length ? tagsId : undefined}
            aria-expanded={selectedFiles
              ? selectedId === row.revision.eventId
              : undefined}
            onclick={() => onSelect(row.revision.eventId)}
          >
            {#if !operationTitles}<strong>{row.revision.message}</strong>{/if}
            <span class="repository-graph-meta">
              {#if showAuthor}{row.revision.author}{row.revision.host
                  ? `@${row.revision.host}`
                  : ""} ·
              {/if}{timestampLabel(row.revision.millis)}
            </span>
          </button>
          <TagList
            {tags}
            id={tagsId}
            label={commit ? "Revision tags" : "Operation tags"}
          />
        </div>
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
    background: var(--background);
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
    cursor: pointer;
  }
  .repository-graph-row:hover {
    background: color-mix(in srgb, var(--foreground) 7%, var(--background));
  }
  .selected {
    background: color-mix(in srgb, var(--foreground) 12%, var(--background));
  }
  .repository-graph-select {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.25rem;
    width: 100%;
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
  .repository-graph-copy {
    display: flex;
    flex: 1 1 12rem;
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
  .repository-inline-files {
    padding-top: 0.5rem;
  }
</style>
