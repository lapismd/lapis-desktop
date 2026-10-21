<!-- SPDX-License-Identifier: Apache-2.0; adapted from jj-store StoreWorkspaceFiles. -->
<script lang="ts">
  import { AppShell } from "@lapismd/design-core/shell";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import {
    FileListing,
    FileListingViewModeToggle,
    type FileListingViewMode,
  } from "@lapismd/design-core/diff";
  import XIcon from "@lucide/svelte/icons/x";
  import UndoIcon from "@lucide/svelte/icons/undo-2";
  import AiSessionTabs from "../sessions/AiSessionTabs.svelte";
  import type { AiHistoryInspection } from "../../../lib/ai/chat/history-inspection.svelte.ts";
  let {
    inspection,
    busy = false,
    height,
    compact,
  }: {
    inspection: AiHistoryInspection;
    busy?: boolean;
    height: number;
    compact: boolean;
  } = $props();
  let mode = $state<FileListingViewMode>("tree");
</script>

<AppShell.Body.Sidebar
  side="right"
  panelId="ai-changes"
  label="Session changes"
  open={inspection.open && (!compact || !inspection.path)}
  style={`--ui-shell-body-sidebar-width:${compact ? "100%" : "min(20rem, 38%)"}`}
>
  <div class="history-rail" style={`height:${height}px`}>
    <header>
      <strong>Changes</strong><Button
        variant="ghost"
        size="icon-sm"
        aria-label="Close session changes"
        onclick={() => {
          inspection.open = false;
          inspection.closeFile();
        }}><XIcon /></Button
      >
    </header>
    <AiSessionTabs
      value={inspection.scope}
      sections={[
        { value: "turn", label: "This turn" },
        { value: "conversation", label: "Conversation" },
      ]}
      label="Change scope"
      onSelect={(value) =>
        (inspection.scope = value as "turn" | "conversation")}
    />
    <ScrollArea class="history-files">
      {#if inspection.scope === "conversation"}
        <nav aria-label="Conversation turns">
          <AiSessionTabs
            value={inspection.record?.context.turn ?? ""}
            sections={inspection.history.records
              .filter((r) => r.phase !== "running")
              .sort((a, b) => a.started_at - b.started_at)
              .map((record, index) => ({
                value: record.context.turn,
                label: `Turn ${index + 1} · ${record.context.agent}`,
              }))}
            label="Saved turns"
            onSelect={(value) => {
              const record = inspection.history.records.find(
                (r) => r.context.turn === value,
              );
              if (record) void inspection.show(record);
            }}
          />
          <p>
            Each comparison uses its own turn boundaries. Edits between turns
            are excluded.
          </p>
        </nav>
      {/if}
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
      {:else}<p>Choose a saved turn to explore its changed files.</p>{/if}
    </ScrollArea>
    <footer>
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
    </footer>
  </div>
</AppShell.Body.Sidebar>

<style>
  .history-rail {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    background: var(--background);
  }
  header,
  .file-heading,
  footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    flex: none;
  }
  header > strong,
  .file-heading > strong {
    flex: 1;
    min-width: 0;
    font-size: 0.8125rem;
  }
  :global(.history-files) {
    flex: 1;
    min-height: 0;
  }
  .file-list {
    padding: 0.375rem;
  }
  footer {
    flex-wrap: wrap;
    margin-block-start: auto;
    border-top: 1px solid var(--border);
  }
  p {
    margin: 0;
    padding: 0.75rem;
    font-size: 0.8125rem;
    color: var(--muted-foreground);
  }
</style>
