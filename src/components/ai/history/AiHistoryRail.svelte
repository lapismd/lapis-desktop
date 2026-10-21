<!-- SPDX-License-Identifier: Apache-2.0; adapted from jj-store StoreWorkspaceFiles/StoreWorkspaceInspector. -->
<script lang="ts">
  import { onDestroy, untrack } from "svelte";
  import {
    AppShell,
    AppShellSidebarController,
    useAppShell,
  } from "@lapismd/design-core/shell";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import { SegmentedControl } from "@lapismd/design-core/forms";
  import { Toggle } from "@lapismd/design-core/shadcn/toggle";
  import {
    FileListing,
    FileListingViewModeToggle,
    type FileListingViewMode,
  } from "@lapismd/design-core/diff";
  import { MarkdownContent } from "@lapismd/design-core/chat";
  import { CodeBlock } from "@lapismd/design-core/shadcn/code-block";
  import XIcon from "@lucide/svelte/icons/x";
  import UndoIcon from "@lucide/svelte/icons/undo-2";
  import RepositoryDiff from "../../repository/RepositoryDiff.svelte";
  import { diffText } from "../../../lib/repository/history-state.ts";
  import type { AiHistoryInspection } from "../../../lib/ai/chat/history-inspection.svelte.ts";
  let {
    inspection,
    busy = false,
  }: { inspection: AiHistoryInspection; busy?: boolean } = $props();
  const shell = useAppShell();
  const sidebar = new AppShellSidebarController("right", false, {
    closed: true,
    width: 420,
    minWidth: 280,
    maxWidth: 760,
  });
  onDestroy(shell.registerSidebar("ai-changes", sidebar));
  let mode = $state<FileListingViewMode>("tree");
  let view = $state("diff");
  $effect(() => {
    if (inspection.open) {
      sidebar.open();
      if (shell.mobile.resolvedMode === "mobile")
        shell.mobile.show("right", "ai-changes");
    } else {
      sidebar.close();
      if (shell.mobile.resolvedMode === "mobile") shell.mobile.showMain();
    }
  });
  $effect(() => {
    inspection.path;
    untrack(() => {
      view = "diff";
    });
  });
  const content = $derived(
    inspection.diff ? diffText(inspection.diff) : undefined,
  );
  const text = $derived(
    content && !("unavailable" in content)
      ? view === "before"
        ? content.oldText
        : content.newText
      : undefined,
  );
  function toggleSelected() {
    if (!inspection.path) return;
    inspection.selected = inspection.selected.includes(inspection.path)
      ? inspection.selected.filter((path) => path !== inspection.path)
      : [...inspection.selected, inspection.path];
  }
</script>

<AppShell.Sidebar
  side="right"
  sidebarController={sidebar}
  label="Session changes"
  resizeLabel="Resize session changes"
  closeable
>
  <AppShell.Sidebar.Header>
    <header>
      <strong>Changes</strong><Button
        variant="ghost"
        size="icon-sm"
        aria-label="Close session changes"
        onclick={() => (inspection.open = false)}><XIcon /></Button
      >
    </header>
    <SegmentedControl
      value={inspection.scope}
      options={["turn", "conversation"]}
      labels={{ turn: "This turn", conversation: "Conversation" }}
      ariaLabel="Change scope"
      onChange={(value) =>
        (inspection.scope = value as "turn" | "conversation")}
    />
  </AppShell.Sidebar.Header>
  <AppShell.Sidebar.Body>
    <ScrollArea class="ai-changes-scroll">
      {#if inspection.scope === "conversation"}<nav
          aria-label="Conversation turns"
        >
          {#each inspection.history.records
            .filter((record) => record.phase !== "running")
            .sort((a, b) => a.started_at - b.started_at) as record, index (record.context.turn)}
            <Button
              variant={inspection.record?.context.turn === record.context.turn
                ? "secondary"
                : "ghost"}
              size="sm"
              onclick={() => void inspection.show(record)}
              >Turn {index + 1} · {record.context.agent} · {record.phase ===
              "complete"
                ? record.outcome
                : "Incomplete"}</Button
            >
          {/each}
          <p>
            Each comparison uses its own turn boundaries. Edits between turns
            are excluded.
          </p>
        </nav>{/if}
      {#if inspection.loading}<p role="status">Loading saved comparison…</p>
      {:else if inspection.unavailable}<p>
          Saved comparison unavailable. <Button
            variant="ghost"
            size="sm"
            onclick={() =>
              inspection.record && void inspection.show(inspection.record)}
            >Retry comparison</Button
          >
        </p>
      {:else if inspection.comparison}
        <div class="file-heading">
          <strong
            >Changed files ({inspection.comparison.files.length}{inspection
              .comparison.complete
              ? ""
              : "+"})</strong
          ><FileListingViewModeToggle bind:mode />
        </div>
        <div class="file-list">
          <FileListing
            files={inspection.comparison.files}
            {mode}
            selectedPath={inspection.path}
            onSelectPath={(path) => void inspection.select(path)}
          />
        </div>
        {#if !inspection.comparison.complete}<p>
            Showing a bounded preview. Whole-turn undo is unavailable.
          </p>{/if}
        {#if inspection.path}<section
            aria-label={`Saved changes to ${inspection.path}`}
          >
            <div class="file-heading">
              <strong title={inspection.path}>{inspection.path}</strong>
              <Toggle
                pressed={inspection.selected.includes(inspection.path)}
                aria-label="Select file for undo"
                disabled={busy}
                onPressedChange={toggleSelected}>Select for undo</Toggle
              >
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Undo file"
                disabled={busy || inspection.undoBusy}
                onclick={() =>
                  inspection.record &&
                  void inspection.previewUndo(inspection.record, [
                    inspection.path!,
                  ])}><UndoIcon /></Button
              >
            </div>
            <SegmentedControl
              value={view}
              options={["diff", "before", "after"]}
              labels={{ diff: "Diff", before: "Before", after: "After" }}
              ariaLabel="File presentation"
              onChange={(value) => (view = value)}
            />
            {#if !inspection.diff}<p role="status">Loading saved file…</p>
            {:else if view === "diff"}<RepositoryDiff
                change={inspection.diff}
                wrap
              />
            {:else if text !== undefined}
              {#if /\.(md|mdx|markdown)$/iu.test(inspection.path)}<MarkdownContent
                  content={text}
                  fullWidth
                />
              {:else}<CodeBlock
                  code={text}
                  language={inspection.path.split(".").at(-1)}
                  width="100%"
                  hasLineNumbers
                />{/if}
            {:else}<p>Text preview is unavailable for this file.</p>{/if}
          </section>{/if}
      {:else}<p>Choose a saved turn to explore its changed files.</p>{/if}
    </ScrollArea>
  </AppShell.Sidebar.Body>
  <AppShell.Sidebar.Footer>
    <div class="undo-actions">
      <Button
        variant="ghost"
        size="sm"
        disabled={busy || inspection.undoBusy || !inspection.selected.length}
        onclick={() =>
          inspection.record &&
          void inspection.previewUndo(inspection.record, inspection.selected)}
        ><UndoIcon data-icon="inline-start" />Undo selected ({inspection
          .selected.length})</Button
      >
      <Button
        variant="ghost"
        size="sm"
        disabled={busy ||
          inspection.undoBusy ||
          !inspection.comparison?.complete ||
          !inspection.comparison.files.length}
        onclick={() =>
          inspection.record && void inspection.previewUndo(inspection.record)}
        >Undo turn</Button
      >
    </div>
  </AppShell.Sidebar.Footer>
</AppShell.Sidebar>

<style>
  header,
  .file-heading,
  .undo-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
  }
  header > strong,
  .file-heading > strong {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 0.8125rem;
  }
  .file-heading {
    border-block: 1px solid var(--border);
  }
  .file-list {
    padding: 0.375rem;
  }
  nav {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.25rem;
    padding: 0.375rem;
  }
  p {
    margin: 0;
    padding: 0.75rem;
    font-size: 0.8125rem;
    color: var(--muted-foreground);
  }
  section {
    min-width: 0;
  }
  :global(.ai-changes-scroll) {
    flex: 1;
    min-height: 0;
    height: 100%;
  }
  .undo-actions {
    flex-wrap: wrap;
  }
</style>
