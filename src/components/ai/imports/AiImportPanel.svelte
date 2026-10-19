<!-- SPDX-License-Identifier: Apache-2.0 -->
<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import DownloadIcon from "@lucide/svelte/icons/download";
  import RefreshIcon from "@lucide/svelte/icons/refresh-cw";
  import {
    createImportState,
    type AiImportProps,
  } from "../../../lib/ai/imports/state.svelte.ts";
  import ImportSources from "./ImportSources.svelte";
  import ImportedTranscript from "./ImportedTranscript.svelte";
  import AiTranscriptLoading from "../chat/AiTranscriptLoading.svelte";
  let props: AiImportProps = $props();
  const state = untrack(() => createImportState(props));
  onMount(() => {
    if (props.sources) void state.refresh();
    return () => props.onDispose(state.close());
  });
</script>

<div class="import-panel" data-testid="ai-import-panel">
  <header class="import-header">
    <div>
      <h2>Import AI sessions</h2>
      <p>
        Preview and save a local, read-only Codex snapshot in {props.scopeDir ||
          "the vault root"}.
      </p>
    </div>
    <Button
      variant="outline"
      size="sm"
      disabled={state.busy || !props.sources}
      onclick={() => void state.refresh()}
      ><RefreshIcon data-icon="inline-start" aria-hidden="true" />Refresh
      sources</Button
    >
  </header>
  {#if !props.sources}
    <Empty.Root
      ><Empty.Header
        ><Empty.Media variant="icon"
          ><DownloadIcon aria-hidden="true" /></Empty.Media
        ><Empty.Title>Local import is unavailable</Empty.Title
        ><Empty.Description
          >This host has no configured transcript source. Existing conversations
          remain available.</Empty.Description
        ></Empty.Header
      ></Empty.Root
    >
  {:else}
    <div class="import-body">
      <ScrollArea class="import-sources"
        ><ImportSources
          rows={state.rows}
          selected={state.selected}
          busy={state.busy}
          loading={!state.loaded && state.busy}
          onSelect={(id) => void state.select(id)}
        /></ScrollArea
      >
      <div class="import-preview">
        {#if state.busy && !state.plan && state.loaded}<AiTranscriptLoading
            composer={false}
          />
        {:else if state.plan}<ImportedTranscript entries={state.plan.entries} />
        {:else}<Empty.Root
            ><Empty.Header
              ><Empty.Media variant="icon"
                ><DownloadIcon aria-hidden="true" /></Empty.Media
              ><Empty.Title>Choose a session to preview</Empty.Title
              ><Empty.Description
                >Preview does not save or start an agent.</Empty.Description
              ></Empty.Header
            ></Empty.Root
          >{/if}
      </div>
    </div>
    <footer class="import-footer">
      <span role="status"
        >{state.saved
          ? state.saved.duplicate
            ? "This snapshot is already saved."
            : "Snapshot saved locally."
          : state.plan
            ? `${state.plan.entries.length} captured entries. Import does not resume the agent.`
            : "Select a source before importing."}</span
      >
      <Button
        size="sm"
        disabled={state.busy || !state.plan}
        onclick={() => void state.save()}
        ><DownloadIcon
          data-icon="inline-start"
          aria-hidden="true"
        />{state.saved ? "Check saved snapshot" : "Import snapshot"}</Button
      >
      {#if state.saved && props.onOpen}<Button
          size="sm"
          variant="outline"
          disabled={state.busy}
          onclick={() => void state.open()}>Open saved snapshot</Button
        >{/if}
    </footer>
  {/if}
</div>

<style>
  .import-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    background: var(--background);
  }
  .import-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
  }
  h2 {
    margin: 0;
    font-size: 0.9375rem;
  }
  p {
    margin: 0.25rem 0 0;
    color: var(--muted-foreground);
    font-size: 0.8125rem;
  }
  .import-body {
    display: grid;
    grid-template-columns: minmax(17rem, 36%) minmax(0, 1fr);
    flex: 1;
    min-height: 0;
  }
  .import-body :global(.import-sources) {
    min-width: 0;
    min-height: 0;
    border-right: 1px solid var(--border);
  }
  .import-preview {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }
  .import-footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-top: 1px solid var(--border);
    font-size: 0.8125rem;
    flex-wrap: wrap;
  }
  .import-footer > span {
    flex: 1;
    color: var(--muted-foreground);
    min-width: 10rem;
  }
  @media (max-width: 700px) {
    .import-body {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: minmax(8rem, 35%) minmax(0, 1fr);
    }
    .import-body :global(.import-sources) {
      border-right: 0;
      border-bottom: 1px solid var(--border);
    }
  }
</style>
