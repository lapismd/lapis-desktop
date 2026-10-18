<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import type { HistoryController } from "../../lib/repository/history-controller.ts";
  import {
    revisionLabel,
    timestampLabel,
    type HistoryState,
  } from "../../lib/repository/history-state.ts";
  let {
    state,
    controller,
  }: { state: HistoryState; controller: HistoryController } = $props();
</script>

<section class="repository-revisions" aria-label="Revisions">
  <h3>Revisions</h3>
  {#if !state.commitsReady && !state.busy}<p role="status">
      Revisions are unavailable. Refresh to try again.
    </p>
  {:else if state.commitsReady && !state.commits.length && !state.busy}<p>
      No revisions in this operation.
    </p>{/if}
  <ol>
    {#each state.commits as commit (commit.id)}
      <li>
        <button
          class="repository-revision"
          aria-pressed={state.revision?.id === commit.id}
          onclick={() => controller.selectRevision(commit)}
        >
          <strong>{revisionLabel(commit)}</strong>
          <code>{commit.id.slice(0, 12)}</code>
          <span
            >{commit.author.name} · {timestampLabel(
              commit.author.timestamp.millis,
            )}</span
          >
          {#if commit.conflicted}<span>Conflicted revision</span>{/if}
        </button>
      </li>
    {/each}
  </ol>
  {#if state.next}<Button
      size="sm"
      disabled={state.busy}
      onclick={() => controller.moreCommits()}>More revisions</Button
    >{/if}
  {#if state.commits.length === 200}<p>Showing the first 200 revisions.</p>{/if}
</section>

<style>
  h3 {
    font-size: 0.95rem;
    font-weight: 600;
    margin: 0;
    padding-bottom: 0.5rem;
  }
  .repository-revisions {
    padding: 0.75rem;
    overflow: auto;
    border-right: 1px solid var(--border);
  }
  ol {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .repository-revision {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    text-align: left;
    width: 100%;
    padding: 0.75rem 0.5rem;
    border: 0;
    border-radius: var(--radius);
    background: transparent;
    color: inherit;
    cursor: pointer;
    overflow-wrap: anywhere;
  }
  .repository-revision:hover,
  .repository-revision[aria-pressed="true"] {
    background: var(--accent);
    color: var(--accent-foreground);
  }
  .repository-revision:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
  .repository-revision span,
  .repository-revision code {
    font-size: 0.75rem;
    color: var(--muted-foreground);
  }
  @container repository-history (max-width: 640px) {
    .repository-revisions {
      max-height: 16rem;
      border-right: 0;
      border-bottom: 1px solid var(--border);
    }
  }
</style>
