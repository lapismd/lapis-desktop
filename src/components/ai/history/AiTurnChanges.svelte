<!-- SPDX-License-Identifier: Apache-2.0; adapted from jj-store StoreAgentChangesPanel.svelte. -->
<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import {
    FileListing,
    FileChangeStats,
    FileListingViewModeToggle,
    type FileListingViewMode,
  } from "@lapismd/design-core/diff";
  import { Spinner } from "@lapismd/design-core/shadcn/spinner";
  import FileDiffIcon from "@lucide/svelte/icons/file-diff";
  import UndoIcon from "@lucide/svelte/icons/undo-2";
  import type { AiTurnRecord } from "../../../lib/repository/ai-history.ts";
  import type { TurnComparison } from "../../../lib/ai/chat/history-comparison.ts";
  import type { AiHistoryInspection } from "../../../lib/ai/chat/history-inspection.svelte.ts";
  let {
    record,
    inspection,
    busy = false,
  }: {
    record: AiTurnRecord;
    inspection: AiHistoryInspection;
    busy?: boolean;
  } = $props();
  let root = $state<HTMLElement>();
  let visible = $state(false),
    expanded = $state(false),
    loading = $state(false),
    unavailable = $state(false);
  let mode = $state<FileListingViewMode>("tree");
  let summary = $state.raw<TurnComparison>();
  let attempt = $state(0);
  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) visible = true;
      },
      { rootMargin: "200px" },
    );
    if (root) observer.observe(root);
    return () => observer.disconnect();
  });
  $effect(() => {
    const selected = record;
    attempt;
    if (!visible || selected.phase !== "complete") return;
    let disposed = false;
    untrack(() => {
      loading = true;
      unavailable = false;
    });
    void inspection
      .summary(selected)
      .then((value) => {
        if (!disposed) summary = value;
      })
      .catch((error) => {
        if (!disposed) {
          unavailable = true;
          inspection.history.report(error);
        }
      })
      .finally(() => {
        if (!disposed) loading = false;
      });
    return () => {
      disposed = true;
    };
  });
  const totals = $derived(
    summary?.countsComplete
      ? summary.files.reduce(
          (s, file) => ({
            additions: s.additions + (file.additions ?? 0),
            deletions: s.deletions + (file.deletions ?? 0),
          }),
          { additions: 0, deletions: 0 },
        )
      : undefined,
  );
</script>

<section
  bind:this={root}
  class="ai-turn-changes"
  aria-label="Saved turn changes"
  aria-busy={loading}
>
  <header>
    <FileDiffIcon aria-hidden="true" />
    <div class="heading">
      <strong
        >{record.phase !== "complete"
          ? "Changes not fully captured"
          : summary
            ? `${summary.complete ? "" : "At least "}${summary.files.length} files changed`
            : "Saved file changes"}</strong
      >
      <span
        >{record.context.agent} · {record.context.requested_model ??
          "Automatic model"}</span
      >
      {#if totals}<FileChangeStats {...totals} showZero />{/if}
    </div>
    <Button
      variant="ghost"
      size="sm"
      disabled={busy ||
        record.phase !== "complete" ||
        !summary?.files.length ||
        !summary.complete ||
        inspection.undoBusy}
      onclick={() => void inspection.previewUndo(record)}
      ><UndoIcon data-icon="inline-start" />Undo turn</Button
    >
    <Button
      variant="outline"
      size="sm"
      disabled={record.phase !== "complete"}
      onclick={() => void inspection.show(record)}>View changes</Button
    >
  </header>
  {#if record.phase !== "complete"}<p>
      The ending boundary is incomplete. Automatic undo is unavailable.
    </p>
  {:else if loading}<p role="status"><Spinner />Loading saved changes…</p>
  {:else if unavailable}<p>
      Saved changes are unavailable. <Button
        variant="ghost"
        size="sm"
        onclick={() => attempt++}>Retry file changes</Button
      >
    </p>
  {:else if summary}
    {#if summary.files.length}<div class="listing">
        <FileListing
          files={expanded ? summary.files : summary.files.slice(0, 3)}
          {mode}
          onSelectPath={(path) => void inspection.show(record, path)}
        />
      </div>
    {:else}<p>No saved file changes in this turn.</p>{/if}
    <footer>
      <Button
        variant="ghost"
        size="sm"
        onclick={() => void inspection.history.binding?.reveal(record)}
        >{(record.after?.commit ?? record.before.commit).slice(0, 12)}</Button
      >
      <span>Observed during this turn</span>
      {#if summary.files.length > 3}<Button
          variant="ghost"
          size="sm"
          onclick={() => (expanded = !expanded)}
          >{expanded
            ? "Show fewer files"
            : `Show ${summary.files.length - 3} more files`}</Button
        >{/if}
      <FileListingViewModeToggle bind:mode />
    </footer>
    {#if !summary.complete}<p>
        Additional files are outside this bounded preview.
      </p>{:else if !summary.countsComplete && summary.files.length}<p>
        Line totals are unavailable for some files.
      </p>{/if}
  {/if}
</section>

<style>
  .ai-turn-changes {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--background);
    min-width: 0;
    margin-block: 0.25rem;
  }
  header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    padding: 0.75rem;
    border-bottom: 1px solid var(--border);
  }
  header > :global(svg) {
    width: 1.125rem;
    height: 1.125rem;
    flex: none;
  }
  .heading {
    display: flex;
    flex: 1;
    min-width: 8rem;
    flex-direction: column;
    font-size: 0.8125rem;
    gap: 0.2rem;
  }
  .heading > span,
  footer > span {
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }
  .listing {
    padding: 0.375rem;
    max-height: 12rem;
    overflow: auto;
  }
  footer {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    flex-wrap: wrap;
    padding: 0.25rem 0.375rem;
  }
  p {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    color: var(--muted-foreground);
    padding: 0.5rem 0.75rem;
    margin: 0;
  }
</style>
