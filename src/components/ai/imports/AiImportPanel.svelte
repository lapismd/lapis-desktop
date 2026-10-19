<!-- SPDX-License-Identifier: Apache-2.0 -->
<script lang="ts">
  import { onMount, untrack } from "svelte";
  import DriveIcon from "@lucide/svelte/icons/hard-drive";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import DownloadIcon from "@lucide/svelte/icons/download";
  import RefreshIcon from "@lucide/svelte/icons/refresh-cw";
  import {
    createImportState,
    type AiImportProps,
  } from "../../../lib/ai/imports/state.svelte.ts";
  import codexIcon from "../../../lib/ai/presentation/assets/codex.svg";
  import AiRecordedTranscript from "../sessions/AiRecordedTranscript.svelte";
  import AiTranscriptLoading from "../chat/AiTranscriptLoading.svelte";
  import TranscriptViewToggle from "../sessions/TranscriptViewToggle.svelte";
  import AiSessionShell from "../sessions/AiSessionShell.svelte";
  import AiSessionMenu from "../sessions/AiSessionMenu.svelte";
  let props: AiImportProps = $props();
  let view = $state<"document" | "classic">("document");
  const imports = untrack(() => createImportState(props));
  const selected = $derived(
    imports.rows.find((r) => r.selector === imports.selected),
  );
  const items = $derived(
    imports.rows.map((r) => ({
      id: r.selector,
      title: r.title,
      profile: r.profile,
      updatedAt: r.updatedAt,
      group: "Local Codex sessions",
      harness: "codex",
    })),
  );
  onMount(() => {
    if (props.sources)
      void imports.refresh().then(() => {
        if (props.initialSelector) void imports.select(props.initialSelector);
      });
    return () => props.onDispose(imports.close());
  });
</script>

<div class="import-panel" data-testid="ai-import-panel">
  <AiSessionShell
    {items}
    activeId={imports.selected}
    title={selected?.title ?? "Import AI sessions"}
    status={selected
      ? `${selected.profile} · Read-only preview`
      : "Local Codex history"}
    label="Importable sessions"
    action="Preview"
    busy={imports.busy}
    loading={!imports.loaded && imports.busy}
    emptyTitle={props.sources
      ? "No importable sessions"
      : "Local import is unavailable"}
    emptyDescription={props.sources
      ? "Refresh to check the configured local Codex sources."
      : "This host has no configured transcript source. Existing conversations remain available."}
    onSelect={(id) => void imports.select(id)}
  >
    {#snippet listActions()}<Button
        variant="ghost"
        size="icon-sm"
        disabled={imports.busy || !props.sources}
        aria-label="Refresh sources"
        onclick={() => void imports.refresh()}
        ><RefreshIcon aria-hidden="true" /></Button
      >{/snippet}
    {#snippet actions()}<TranscriptViewToggle bind:view /><AiSessionMenu
        busy={imports.busy}
        unavailable={!props.sources}
        refreshLabel="Refresh sources"
        onRefresh={() => void imports.refresh()}
        onOpen={imports.saved && props.onOpen
          ? () => void imports.open()
          : undefined}
      />{/snippet}
    {#snippet listFooter()}<footer class="ai-session-list-footer">
        <div class="ai-session-status-items">
          <span class="ai-session-status-item"
            ><DownloadIcon aria-hidden="true" />{imports.rows.length} sources</span
          >
          <span class="ai-session-status-item ai-session-status-item--end"
            ><DriveIcon aria-hidden="true" />Local Codex</span
          >
        </div>
      </footer>{/snippet}
    {#snippet footer()}
      <footer class="ai-session-footer">
        <span class="ai-session-status" role="status">
          <span class="ai-session-status-item"
            ><DriveIcon aria-hidden="true" />{imports.saved
              ? imports.saved.duplicate
                ? "This snapshot is already saved."
                : "Snapshot saved locally."
              : imports.plan
                ? `${imports.plan.entries.length} captured entries`
                : "Select a source before importing."}</span
          >
        </span>
        <Button
          size="xs"
          variant="ghost"
          disabled={imports.busy || !imports.plan}
          onclick={() => void imports.save()}
        >
          <DownloadIcon
            data-icon="inline-start"
            aria-hidden="true"
          />{imports.saved ? "Check saved snapshot" : "Import snapshot"}
        </Button>
        {#if imports.saved && props.onOpen}<Button
            size="xs"
            variant="ghost"
            disabled={imports.busy}
            onclick={() => void imports.open()}>Open saved snapshot</Button
          >{/if}
      </footer>
    {/snippet}
    {#if imports.busy && !imports.plan && imports.loaded}<AiTranscriptLoading
        composer={false}
      />
    {:else if imports.plan}<AiRecordedTranscript
        app={props.app}
        entries={imports.plan.entries}
        bind:view
        showViewToolbar={false}
        assistant={{ name: "Codex", image: codexIcon }}
      />
    {:else}<Empty.Root
        ><Empty.Header
          ><Empty.Media variant="icon"
            ><DownloadIcon aria-hidden="true" /></Empty.Media
          ><Empty.Title
            >{props.sources
              ? "Choose a session to preview"
              : "Local import is unavailable"}</Empty.Title
          ><Empty.Description
            >{props.sources
              ? `Preview does not save or start an agent. Imports are saved in ${props.scopeDir || "the vault root"}.`
              : "This host has no configured transcript source. Existing conversations remain available."}</Empty.Description
          ></Empty.Header
        ></Empty.Root
      >{/if}
  </AiSessionShell>
</div>

<style>
  .import-panel {
    height: 100%;
    min-height: 0;
    min-width: 0;
  }
</style>
