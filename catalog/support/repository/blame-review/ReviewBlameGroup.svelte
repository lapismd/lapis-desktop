<script lang="ts">
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import type { TokenLine } from "@lapismd/design-core/shadcn/code-block";
  import type { BlameCommit } from "../../../../src/lib/repository/blame-model.ts";
  import RepositoryAuthorAvatar from "../../../../src/components/repository/RepositoryAuthorAvatar.svelte";
  import { RelativeTime } from "@lapismd/design-core/shadcn/relative-time";
  import type { BlameChunk } from "../../../../src/lib/repository/blame-chunks.ts";
  import ReviewBlameCommitTitle from "./ReviewBlameCommitTitle.svelte";
  let {
    chunk,
    lines,
    tokens,
    commit,
    now,
    pending,
    onOpen,
    stats,
  }: {
    chunk: BlameChunk;
    lines: string[];
    tokens: TokenLine[];
    commit?: BlameCommit;
    now?: number;
    pending: boolean;
    onOpen?: (commit: string) => void;
    stats?: { additions: number; deletions: number };
  } = $props();
</script>

<div
  class="blame-group"
  data-continued={chunk.continued || undefined}
  data-first={chunk.start === 1 || undefined}
>
  {#if chunk.end === lines.length + 1}<div
      class="blame-group__end-divider"
      aria-hidden="true"
    ></div>{/if}
  <div class="blame-group__gutter">
    <div
      class="blame-group__origin"
      aria-label={`Origin for lines ${chunk.start}–${chunk.end - 1}${chunk.continued ? " (continued)" : ""}`}
    >
      {#if commit}
        <RepositoryAuthorAvatar
          name={commit.author.name}
          email={commit.author.email}
          size="xs"
        />
        <span class="blame-group__author" title={commit.author.name}
          >{commit.author.name}</span
        >
        <ReviewBlameCommitTitle
          {commit}
          {stats}
          {now}
          {onOpen}
          continued={chunk.continued}
        />
        <span class="blame-group__time"
          ><RelativeTime
            timestamp={Number(commit.author.timestamp.millis)}
            {now}
          /></span
        >
      {:else if pending}
        <span
          class="blame-group__loading"
          role="status"
          aria-label={`Loading origin for lines ${chunk.start}–${chunk.end - 1}`}
          ><Skeleton style="width:100%;height:0.8rem" /></span
        >
      {:else}
        <span class="blame-group__unknown">Origin unavailable</span>
      {/if}
    </div>
  </div>
  <div class="blame-group__source">
    {#each lines.slice(chunk.start - 1, chunk.end - 1) as line, index (index)}
      {@const number = chunk.start + index}
      <div class="blame-group__line" data-line={number}>
        <span class="blame-group__number" aria-label={`Line ${number}`}
          >{number}</span
        >
        <code
          >{#each tokens[number - 1] ?? [] as token, ti (ti)}{line.slice(
              ti ? tokens[number - 1]![ti - 1]!.end : 0,
              token.start,
            )}<span class={`ui-code-token-${token.type}`}
              >{line.slice(token.start, token.end)}</span
            >{/each}{line.slice(tokens[number - 1]?.at(-1)?.end ?? 0) ||
            (line ? "" : "\u200b")}</code
        >
      </div>
    {/each}
  </div>
</div>

<style>
  .blame-group {
    position: relative;
    display: grid;
    grid-template-columns: min(22rem, 45cqw) minmax(0, 1fr);
  }
  .blame-group__end-divider {
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    z-index: 2;
    border-bottom: 1px solid var(--border);
    pointer-events: none;
  }
  .blame-group__gutter {
    position: sticky;
    left: 0;
    z-index: 1;
    background: var(--background);
    border-right: 1px solid var(--border);
    font-family: var(--font-sans, sans-serif);
  }
  .blame-group__origin {
    position: sticky;
    top: 0;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    height: 28px;
    box-sizing: border-box;
    padding: 0 0.5rem;
    border-top: 1px solid var(--border);
  }
  .blame-group__source {
    box-shadow: inset 0 1px 0 var(--border);
  }
  .blame-group[data-first] .blame-group__origin {
    border-top: 0;
  }
  .blame-group[data-first] .blame-group__source {
    box-shadow: none;
  }
  .blame-group__author {
    max-width: 4.5rem;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 0.75rem;
  }
  .blame-group__time {
    flex: none;
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }
  .blame-group__loading {
    width: 100%;
    padding: 0 0.5rem;
  }
  .blame-group__unknown {
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }
  .blame-group__line {
    display: flex;
    height: 28px;
    line-height: 28px;
    white-space: pre;
  }
  .blame-group__number {
    width: 5rem;
    flex: none;
    text-align: right;
    padding-right: 1rem;
    color: var(--muted-foreground);
    user-select: none;
  }
  code {
    font: inherit;
    tab-size: 4;
    padding-right: 1rem;
  }
</style>
