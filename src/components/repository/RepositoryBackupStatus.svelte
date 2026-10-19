<script lang="ts">
  import { onMount } from "svelte";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import { RelativeTime } from "@lapismd/design-core/shadcn/relative-time";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import History from "@lucide/svelte/icons/history";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import Check from "@lucide/svelte/icons/check";
  import CircleAlert from "@lucide/svelte/icons/circle-alert";
  import RepositoryIdentifiers from "./RepositoryIdentifiers.svelte";
  import { encodeJjChangeId } from "../../lib/repository/graph/repository-log-graph.ts";
  import type {
    BackupController,
    BackupStatus,
  } from "../../lib/repository/backup.ts";
  let {
    controller,
    openRevision,
    copyText,
  }: {
    controller: BackupController;
    openRevision(operation: string, revision: string): Promise<void>;
    copyText(value: string): Promise<void>;
  } = $props();
  let value: BackupStatus = $state({
    phase: "saving",
    checkpoint: null,
    error: null,
  });
  let open = $state(false);
  const label = $derived(
    value.phase === "saving"
      ? "Saving locally"
      : value.phase === "ready"
        ? "Saved locally"
        : value.phase === "closed"
          ? "History paused"
          : "History needs attention",
  );
  onMount(() => controller.subscribe((status) => (value = status)));
  async function inspect() {
    if (!value.checkpoint) return;
    open = false;
    await openRevision(value.checkpoint.operation, value.checkpoint.commit);
  }
</script>

<div
  class="backup-status"
  aria-label="Vault backup"
  aria-busy={value.phase === "saving"}
>
  <Popover.Root bind:open>
    <Popover.Trigger>
      {#snippet child({ props })}
        <button
          {...props}
          type="button"
          class="summary"
          aria-label={`Vault history: ${label}`}
        >
          {#if value.phase === "ready"}<Check aria-hidden="true" />
          {:else if value.phase === "failed"}<CircleAlert aria-hidden="true" />
          {:else}<History aria-hidden="true" />{/if}
          {label}
        </button>
      {/snippet}
    </Popover.Trigger>
    <Popover.Content
      side="top"
      align="end"
      style="width:min(26rem,calc(100vw - 1rem));padding:0"
    >
      <section class="backup-card" aria-label="Vault history details">
        <header>
          <History aria-hidden="true" /><strong>Local history</strong>
        </header>
        {#if value.checkpoint}
          <button type="button" class="subject" onclick={inspect}
            >{value.checkpoint.description}</button
          >
          <RepositoryIdentifiers
            {copyText}
            placement="inline"
            commitId={value.checkpoint.commit}
            changeId={encodeJjChangeId(value.checkpoint.change_id)}
          />
          <span
            >Last saved <RelativeTime
              timestamp={value.checkpoint.timestamp_millis}
            /></span
          >
          <p>
            Saved editor and external file changes are captured automatically.
            Unsaved editor changes appear after saving.
          </p>
          <button type="button" class="open-log" onclick={inspect}
            >Open in JJ Log</button
          >
        {:else if value.phase === "saving"}
          <div
            class="loading"
            role="status"
            aria-label="Preparing local history"
          >
            <Skeleton style="height:1rem;width:90%" /><Skeleton
              style="height:1rem;width:65%"
            />
          </div>
        {:else}<p>
            {value.phase === "closed"
              ? "Automatic history is paused in Repository History settings."
              : "History is unavailable. Retry to resume automatic capture."}
          </p>{/if}
      </section>
    </Popover.Content>
  </Popover.Root>
  <button
    type="button"
    class="refresh"
    aria-label="Save vault checkpoint now"
    title="Save vault checkpoint now"
    disabled={value.phase === "saving" || value.phase === "closed"}
    onclick={() => controller.refresh()}
    ><RefreshCw aria-hidden="true" /></button
  >
</div>

<style>
  .backup-status {
    display: inline-flex;
    min-height: 1.25rem;
    align-items: stretch;
    border: 0;
    border-radius: var(--radius);
    color: inherit;
    font: inherit;
    background: color-mix(
      in oklab,
      var(--ui-workspace-muted-foreground) 6%,
      var(--ui-workspace-panel)
    );
  }
  button {
    appearance: none;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  button:hover {
    background: var(--accent);
    color: var(--accent-foreground);
  }
  button:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 1px;
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .summary,
  .refresh {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0 0.4rem;
    line-height: 1;
    white-space: nowrap;
  }
  .summary {
    border-radius: var(--radius) 0 0 var(--radius);
  }
  .refresh {
    border-radius: 0 var(--radius) var(--radius) 0;
    background: color-mix(
      in oklab,
      var(--ui-workspace-muted-foreground) 12%,
      var(--ui-workspace-panel)
    );
  }
  .backup-status :global(svg),
  header :global(svg) {
    width: 0.875rem;
    height: 0.875rem;
    flex: none;
  }
  .backup-card {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 0.85rem;
    color: var(--foreground);
    font-size: 0.8rem;
  }
  header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .subject {
    padding: 0;
    text-align: left;
    font-weight: 600;
  }
  .subject:hover {
    background: transparent;
    color: var(--primary);
  }
  p {
    margin: 0;
    color: var(--muted-foreground);
    line-height: 1.5;
  }
  .open-log {
    align-self: flex-start;
    padding: 0.35rem 0.5rem;
    border-radius: var(--radius);
  }
  .loading {
    display: grid;
    gap: 0.6rem;
  }
</style>
