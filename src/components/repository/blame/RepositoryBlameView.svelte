<script lang="ts">
  import {
    tokenizeAsync,
    type TokenLine,
  } from "@lapismd/design-core/shadcn/code-block";
  import { resolveDiffLanguage } from "@lapismd/design-core/diff";
  import type { BlameState } from "../../../lib/repository/blame-model.ts";
  import RepositoryBlameRows from "./RepositoryBlameRows.svelte";
  import RepositoryBlameGroup from "./RepositoryBlameGroup.svelte";
  import {
    blameChunks,
    sourceLines,
  } from "../../../lib/repository/blame-chunks.ts";
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
  let viewport = $state<HTMLDivElement>();
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

<!-- Keyboard focus permits native horizontal and vertical source scrolling. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  bind:this={viewport}
  class="store-blame"
  role="region"
  aria-label={`Blame for ${path}`}
  tabindex="0"
>
  {#if lines.length === 0}
    <p class="store-blame__empty">This file has no lines to attribute.</p>
  {:else}
    <div
      class="store-blame__track"
      style:width={`max(100%, calc(28rem + ${columns}ch))`}
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
          />
        {/snippet}
      </RepositoryBlameRows>
    </div>
  {/if}
</div>

<style>
  .store-blame {
    container-type: inline-size;
    height: 100%;
    min-height: 0;
    overflow: auto;
    position: relative;
    font-size: var(--community-text-secondary, 0.875rem);
  }
  .store-blame:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: -2px;
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
