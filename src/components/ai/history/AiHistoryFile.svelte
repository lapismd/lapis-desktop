<!-- SPDX-License-Identifier: Apache-2.0; adapted from jj-store StoreWorkspaceInspector. -->
<script lang="ts">
  import { untrack } from "svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import { Toggle } from "@lapismd/design-core/shadcn/toggle";
  import { MarkdownContent } from "@lapismd/design-core/chat";
  import { CodeBlock } from "@lapismd/design-core/shadcn/code-block";
  import XIcon from "@lucide/svelte/icons/x";
  import FileIcon from "@lucide/svelte/icons/file";
  import UndoIcon from "@lucide/svelte/icons/undo-2";
  import AiSessionTabs from "../sessions/AiSessionTabs.svelte";
  import RepositoryDiff from "../../repository/RepositoryDiff.svelte";
  import { diffText } from "../../../lib/repository/history-state.ts";
  import type { AiHistoryInspection } from "../../../lib/ai/chat/history-inspection.svelte.ts";
  let {
    inspection,
    busy = false,
  }: { inspection: AiHistoryInspection; busy?: boolean } = $props();
  let view = $state("diff");
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

<section
  class="history-file"
  aria-label={`Saved changes to ${inspection.path}`}
>
  <header>
    <div class="file-title">
      <FileIcon /><strong title={inspection.path}>{inspection.path}</strong>
    </div>
    <Toggle
      pressed={inspection.selected.includes(inspection.path ?? "")}
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
        inspection.path &&
        void inspection.previewUndo(inspection.record, [inspection.path])}
      ><UndoIcon /></Button
    >
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Close saved file"
      onclick={() => inspection.closeFile()}><XIcon /></Button
    >
  </header>
  <AiSessionTabs
    value={view}
    sections={[
      { value: "diff", label: "Diff" },
      { value: "before", label: "Before" },
      { value: "after", label: "After" },
    ]}
    label="File presentation"
    onSelect={(next) => (view = next)}
  />
  <ScrollArea class="history-file-scroll">
    <div class="file-content">
      {#if !inspection.diff}<p role="status">Loading saved file…</p>
      {:else if view === "diff"}<RepositoryDiff change={inspection.diff} wrap />
      {:else if text !== undefined}
        {#if /\.(md|mdx|markdown)$/iu.test(inspection.path ?? "")}<MarkdownContent
            content={text}
            fullWidth
          />
        {:else}<CodeBlock
            code={text}
            language={inspection.path?.split(".").at(-1)}
            width="100%"
            hasLineNumbers
          />{/if}
      {:else}<p>Text preview is unavailable for this file.</p>{/if}
    </div>
  </ScrollArea>
</section>

<style>
  .history-file {
    display: flex;
    flex-direction: column;
    height: var(--ai-session-body-height, 100%);
    min-width: 0;
    min-height: 0;
    background: var(--background);
  }
  header {
    display: flex;
    align-items: center;
    flex: none;
    gap: 0.375rem;
    padding: 0.5rem;
  }
  .file-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
  }
  .file-title :global(svg) {
    width: 1rem;
    height: 1rem;
    flex: none;
  }
  strong {
    font-size: 0.8125rem;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .file-content {
    min-width: 0;
    padding: 0.75rem;
  }
  :global(.history-file-scroll) {
    flex: 1;
    min-height: 0;
  }
</style>
