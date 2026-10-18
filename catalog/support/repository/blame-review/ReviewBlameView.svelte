<script lang="ts">
  import { reviewCommitStats } from "./commit-stats.ts";
  import {
    tokenizeAsync,
    type TokenLine,
  } from "@lapismd/design-core/shadcn/code-block";
  import { resolveDiffLanguage } from "@lapismd/design-core/diff";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import type { BlameState } from "../../../../src/lib/repository/blame-model.ts";
  import RepositoryBlameRows from "./ReviewBlameRows.svelte";
  import RepositoryBlameGroup from "./ReviewBlameGroup.svelte";
  import {
    blameChunks,
    sourceLines,
  } from "../../../../src/lib/repository/blame-chunks.ts";
  let {
    contents,
    path,
    view,
    now,
    onOpen,
  }: {
    contents: string;
    path: string;
    view: BlameState;
    now?: number;
    onOpen?: (commit: string) => void;
  } = $props();
  const lines = $derived(sourceLines(contents));
  const chunks = $derived(
    blameChunks(lines.length, view.progress?.ranges ?? []),
  );
  const columns = $derived(
    lines.reduce(
      (max, line) => Math.max(max, line.replaceAll("\t", "    ").length),
      0,
    ),
  );
  let viewport = $state<HTMLElement | null>(null);
  let tokens = $state<TokenLine[]>([]);
  $effect(() => {
    const abort = new AbortController();
    const code = contents;
    const language = resolveDiffLanguage(path) ?? "plaintext";
    tokens = [];
    void (async () => {
      const value = await tokenizeAsync(code, language, abort.signal);
      if (!abort.signal.aborted) tokens = value;
    })().catch(() => {
      /* Highlighting is optional; plain source remains usable. */
    });
    return () => abort.abort();
  });
</script>

<div class="store-blame">
  <ScrollArea
    bind:viewportRef={viewport}
    orientation="both"
    style="height:100%;min-height:0;min-width:0"
    role="region"
    aria-label={`Blame for ${path}`}
  >
    {#if lines.length === 0}
      <p class="store-blame__empty">This file has no lines to attribute.</p>
    {:else}
      <div
        class="store-blame__track"
        style:width={`max(100%, calc(28rem + ${columns}ch))`}
        style:--blame-line-digits={String(lines.length).length}
      >
        <RepositoryBlameRows
          rows={chunks}
          {viewport}
          getKey={(chunk) => String(chunk.start)}
          estimateSize={(chunk) => (chunk ? chunk.end - chunk.start : 1) * 28}
        >
          {#snippet row(chunk)}
            <RepositoryBlameGroup
              {chunk}
              {lines}
              {tokens}
              {now}
              {onOpen}
              commit={chunk.commitId
                ? view.progress?.commits[chunk.commitId]
                : undefined}
              pending={view.status === "loading"}
              stats={chunk.commitId
                ? reviewCommitStats[chunk.commitId]
                : undefined}
            />
          {/snippet}
        </RepositoryBlameRows>
      </div>
    {/if}
  </ScrollArea>
</div>

<style>
  .store-blame {
    container-type: inline-size;
    height: 100%;
    min-height: 0;
    position: relative;
    font-size: var(--community-text-secondary, 0.875rem);
  }
  .store-blame__track {
    min-width: 100%;
    font-family: var(--font-mono, monospace);
  }
  .store-blame__empty {
    padding: 1rem;
    color: var(--muted-foreground);
  }
</style>
