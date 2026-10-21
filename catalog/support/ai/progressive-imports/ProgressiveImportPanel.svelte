<script lang="ts">
  import { onMount, untrack } from "svelte";
  import type { App } from "@lapis-notes/api";
  import { AppShell } from "@lapismd/design-core/shell";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { Progress } from "@lapismd/design-core/shadcn/progress";
  import { Spinner } from "@lapismd/design-core/shadcn/spinner";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import FolderIcon from "@lucide/svelte/icons/folder-open";
  import PauseIcon from "@lucide/svelte/icons/pause";
  import PlayIcon from "@lucide/svelte/icons/play";
  import RefreshIcon from "@lucide/svelte/icons/refresh-cw";
  import DownloadIcon from "@lucide/svelte/icons/download";
  import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
  import AlertIcon from "@lucide/svelte/icons/triangle-alert";
  import AiSessionFrame from "../../../../src/components/ai/sessions/AiSessionFrame.svelte";
  import AiSessionThread from "../../../../src/components/ai/sessions/AiSessionThread.svelte";
  import AiRecordedTranscript from "../../../../src/components/ai/sessions/AiRecordedTranscript.svelte";
  import TranscriptViewToggle from "../../../../src/components/ai/sessions/TranscriptViewToggle.svelte";
  import codex from "../../../../src/lib/ai/presentation/assets/codex.svg";
  import { registerAiReview } from "../review.ts";
  import { ImportBrowserReview, type Scenario } from "./browser.svelte.ts";
  import { folders, type Session } from "./data.ts";
  import SourceTree from "./SourceTree.svelte";
  let {
    app,
    scenario = "browse",
    automatic = true,
  }: { app: App; scenario?: Scenario; automatic?: boolean } = $props();
  const browser = untrack(() => new ImportBrowserReview(scenario, automatic));
  let root = $state<HTMLElement>(),
    width = $state(0),
    height = $state(0);
  let open = $state(true);
  let view = $state<"document" | "classic">("document");
  const compact = $derived(width > 0 && width < 640);
  const folder = $derived(
    folders.find((folder) => folder.path === browser.selected?.folder),
  );
  const oldEpoch = untrack(() => browser.epoch);
  $effect(() => {
    if (compact && browser.selected) untrack(() => (open = false));
  });
  $effect(() =>
    root
      ? registerAiReview(root, {
          read: (name) =>
            String(
              {
                loads: browser.loads,
                reads: browser.reads,
                cancelled: browser.cancelled,
                entries: browser.entries.length,
                phase: browser.phase,
              }[name as "loads"] ?? "",
            ),
          actions: {
            "finish-folder": () => browser.finishFolder(),
            "next-batch": () => browser.advance(),
            complete: () => browser.complete(),
            "source-changed": () => browser.changeSource(),
            "late-batch": () => browser.receive(oldEpoch),
            "finish-index": () => browser.finishIndex(),
          },
        })
      : undefined,
  );
  onMount(() => {
    browser.start();
    return () => browser.close();
  });
  function select(session: Session) {
    browser.select(session);
    if (compact) open = false;
  }
</script>

<div class="progressive-import" bind:this={root} data-ai-review>
  <AiSessionFrame
    label="Importable AI sessions"
    bind:width
    bind:height
    contentHidden={compact && open}
  >
    {#snippet navigation()}
      <AppShell.Body.Sidebar
        side="left"
        panelId="progressive-import-sources"
        label="Import sources"
        bind:open
        class="ai-session-list-region"
        style={`--ui-shell-body-sidebar-width:${compact ? "100%" : "min(23rem, 38%)"}`}
      >
        <SourceTree
          {browser}
          onSelect={select}
          onClose={compact ? () => (open = false) : undefined}
        />
      </AppShell.Body.Sidebar>
    {/snippet}
    <AiSessionThread
      {height}
      title={browser.selected?.title ?? "Import AI sessions"}
      status={browser.selected
        ? `${browser.selected.source} · ${folder?.location ?? ""} · Read-only preview`
        : "Browse local history by harness and project"}
      harness="codex"
      selected={!!browser.selected}
      listLabel="Import sources"
      expanded={open}
      onToggle={() => (open = !open)}
    >
      {#snippet actions()}
        {#if browser.phase === "reading"}<Button
            variant="ghost"
            size="icon-sm"
            aria-label={browser.paused
              ? "Resume transcript loading"
              : "Pause transcript loading"}
            onclick={() => browser.togglePause()}
            >{#if browser.paused}<PlayIcon
                aria-hidden="true"
              />{:else}<PauseIcon aria-hidden="true" />{/if}</Button
          >{/if}
        {#if browser.phase === "ready"}<Button
            variant="ghost"
            size="icon-sm"
            aria-label="Reload preview"
            title="Reload preview"
            onclick={() => browser.reload()}
            ><RefreshIcon aria-hidden="true" /></Button
          >{/if}
        {#if browser.selected}<TranscriptViewToggle bind:view />{/if}
      {/snippet}
      {#snippet footer()}
        <footer class="ai-session-footer import-footer">
          <span class="ai-session-status" role="status">
            {#if browser.imported}<CircleCheckIcon aria-hidden="true" />Snapshot
              saved locally.
            {:else if browser.phase === "ready"}<CircleCheckIcon
                aria-hidden="true"
              />{browser.cachedPreview
                ? "Cached preview · Ready to import"
                : "Snapshot verified · Ready to import"}
            {:else if browser.phase === "changed"}<AlertIcon
                aria-hidden="true"
              />Preview incomplete
            {:else if browser.phase === "reading"}<Spinner />{browser.paused
                ? "Reading paused"
                : "Reading session…"}
            {:else}<FolderIcon aria-hidden="true" />Select a session to preview{/if}
          </span>
          <Button
            size="xs"
            variant="ghost"
            disabled={browser.phase !== "ready" || browser.imported}
            onclick={() => (browser.imported = true)}
            ><DownloadIcon
              data-icon="inline-start"
              aria-hidden="true"
            />{browser.imported ? "Imported" : "Import snapshot"}</Button
          >
        </footer>
      {/snippet}
      {#if browser.selected}
        {#if browser.phase === "reading"}<section
            class="preview-progress"
            aria-label="Transcript loading"
          >
            <div>
              <span>{browser.entries.length} messages available</span><small
                >{browser.paused
                  ? "Paused"
                  : `Reading ${browser.selected.size} of local history`}</small
              >
            </div>
            <Progress
              value={browser.progress}
              aria-label="Transcript loading progress"
            />
          </section>
        {:else if browser.phase === "changed"}<div
            class="source-changed"
            role="status"
          >
            <AlertIcon aria-hidden="true" /><span
              >The source changed. Reload to verify the current snapshot.</span
            ><Button variant="ghost" size="sm" onclick={() => browser.reload()}
              ><RefreshIcon data-icon="inline-start" aria-hidden="true" />Reload
              preview</Button
            >
          </div>
        {:else if browser.cachedPreview}<div class="cache-status">
            <Badge variant="secondary">Cached preview</Badge><span
              >Available immediately from the last verified snapshot.</span
            >
          </div>{/if}
        <AiRecordedTranscript
          {app}
          entries={browser.entries}
          bind:view
          showViewToolbar={false}
          assistant={{ name: "Codex", image: codex }}
        />
      {:else}<Empty.Root
          ><Empty.Header
            ><Empty.Media variant="icon"><FolderIcon /></Empty.Media
            ><Empty.Title
              >{browser.folder
                ? "Choose a session"
                : "Your local AI history"}</Empty.Title
            ><Empty.Description
              >{browser.folder
                ? "Select a conversation from this folder. Messages appear as the session is read."
                : "Expand a harness and choose a project folder. Sessions load only when you open that folder."}</Empty.Description
            ></Empty.Header
          ></Empty.Root
        >{/if}
    </AiSessionThread>
  </AiSessionFrame>
</div>

<style>
  .progressive-import {
    height: 100%;
    min-width: 0;
    min-height: 0;
  }
  .preview-progress {
    flex: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 0 0.75rem 0.5rem;
    padding: 0.625rem 0.75rem;
    background: var(--muted);
    border-radius: 0.5rem;
  }
  .preview-progress > div {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.375rem;
    font-size: 0.75rem;
  }
  small {
    font-size: 0.6875rem;
    color: var(--muted-foreground);
  }
  .source-changed,
  .cache-status {
    display: flex;
    flex: none;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    color: var(--muted-foreground);
  }
  .source-changed > :global(svg) {
    width: 1rem;
    height: 1rem;
    flex: none;
  }
  .import-footer .ai-session-status {
    align-items: center;
    gap: 0.375rem;
    white-space: nowrap;
    font-size: 0.6875rem;
  }
  .import-footer .ai-session-status > :global(svg) {
    width: 0.875rem;
    height: 0.875rem;
    flex: none;
  }
</style>
