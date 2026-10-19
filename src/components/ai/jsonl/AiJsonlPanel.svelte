<!-- SPDX-License-Identifier: Apache-2.0; Notes-owned file preview, no writer/runtime. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { App } from "@lapis-notes/api";
  import { readable, type Readable } from "svelte/store";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import FileJsonIcon from "@lucide/svelte/icons/file-json";
  import LockIcon from "@lucide/svelte/icons/lock-keyhole";
  import AlertIcon from "@lucide/svelte/icons/triangle-alert";
  import AiSessionFrame from "../sessions/AiSessionFrame.svelte";
  import AiSessionThread from "../sessions/AiSessionThread.svelte";
  import AiRecordedTranscript from "../sessions/AiRecordedTranscript.svelte";
  import TranscriptViewToggle from "../sessions/TranscriptViewToggle.svelte";
  import AiTranscriptLoading from "../chat/AiTranscriptLoading.svelte";
  import AiJsonlLoading from "./AiJsonlLoading.svelte";
  import AiJsonlRecords from "./AiJsonlRecords.svelte";
  import { createAiJsonlPreview } from "../../../lib/ai/jsonl/preview.ts";
  let {
    app,
    data,
    filePath,
    loading = readable(false),
  }: {
    app: App;
    data: string;
    filePath: string;
    loading?: Readable<boolean>;
  } = $props();
  let toolInspector = $state<Snippet>();
  let height = $state(0),
    view = $state<"document" | "classic">("document");
  const preview = $derived(createAiJsonlPreview(filePath, data));
  const count = $derived(
    preview.kind === "error"
      ? 0
      : preview.kind === "transcript"
        ? preview.entries.length
        : preview.records.length,
  );
  const filename = $derived(filePath.split("/").at(-1) || "JSONL preview");
</script>

<div
  class="ai-jsonl-panel"
  data-ui-component="ai-jsonl-view"
  data-preview-kind={preview.kind}
  data-file-path={filePath}
  aria-busy={$loading}
>
  <AiSessionFrame label="AI JSONL preview" bind:height {toolInspector}>
    <AiSessionThread
      {height}
      title={filename}
      status={filePath}
      {identity}
      {actions}
      {footer}
    >
      {#if $loading}{#if filename.toLowerCase() === "transcript.jsonl"}<AiTranscriptLoading
            composer={false}
          />{:else}<AiJsonlLoading />{/if}
      {:else if preview.kind === "error"}
        <Empty.Root
          ><Empty.Header
            ><Empty.Media variant="icon"
              ><AlertIcon aria-hidden="true" /></Empty.Media
            ><Empty.Title>Unable to preview this file</Empty.Title
            ><Empty.Description>{preview.message}</Empty.Description
            ></Empty.Header
          ></Empty.Root
        >
      {:else}
        {#each preview.warnings as warning}<p
            class="jsonl-warning"
            role="status"
          >
            <AlertIcon aria-hidden="true" /><span
              >Line {warning.line}: {warning.message}</span
            >
          </p>{/each}
        {#if count === 0}
          <Empty.Root
            ><Empty.Header
              ><Empty.Media variant="icon"
                ><FileJsonIcon aria-hidden="true" /></Empty.Media
              ><Empty.Title>Empty JSONL file</Empty.Title><Empty.Description
                >Records will appear here when they are appended.</Empty.Description
              ></Empty.Header
            ></Empty.Root
          >
        {:else if preview.kind === "transcript"}
          {#key filePath}<AiRecordedTranscript
              {app}
              sourcePath={filePath}
              entries={preview.entries}
              {view}
              showViewToolbar={false}
              inspectTools
              bind:toolInspector
              capturedUser={false}
              label="Saved transcript preview"
            />{/key}
        {:else}<AiJsonlRecords {preview} />{/if}
      {/if}
    </AiSessionThread>
  </AiSessionFrame>
</div>
{#snippet identity()}<FileJsonIcon
    class="jsonl-file-icon"
    aria-hidden="true"
  />{/snippet}
{#snippet actions()}{#if preview.kind === "transcript"}<TranscriptViewToggle
      bind:view
    />{/if}{/snippet}
{#snippet footer()}
  <footer class="ai-session-footer" aria-label="File preview status">
    <span class="ai-session-status-item"
      ><LockIcon aria-hidden="true" />Read-only</span
    >
    <span class="ai-session-status-item"
      >{count} {preview.kind === "agents" ? "events" : "records"}</span
    >
  </footer>
{/snippet}

<style>
  .ai-jsonl-panel,
  :global(.ai-jsonl-file-content) {
    height: 100%;
    min-width: 0;
    min-height: 0;
  }
  .ai-jsonl-panel {
    background: var(--sidebar, var(--muted));
  }
  :global(.jsonl-file-icon) {
    width: 1.125rem;
    height: 1.125rem;
    flex: none;
    color: var(--muted-foreground);
    margin-inline-start: 0.5rem;
  }
  .jsonl-warning {
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
    padding: 0.5rem 1rem;
    margin: 0;
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }
  .jsonl-warning :global(svg) {
    width: 0.875rem;
    height: 0.875rem;
    flex: none;
    align-self: center;
  }
</style>
