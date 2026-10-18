<script lang="ts">
  import * as HoverCard from "@lapismd/design-core/shadcn/hover-card";
  import { FileChangeStats } from "@lapismd/design-core/diff";
  import { RelativeTime } from "@lapismd/design-core/shadcn/relative-time";
  import GitCommitHorizontal from "@lucide/svelte/icons/git-commit-horizontal";
  import RepositoryAuthorAvatar from "../RepositoryAuthorAvatar.svelte";
  import type { BlameCommit } from "../../../lib/repository/blame-model.ts";
  let {
    commit,
    continued = false,
    now,
    stats,
    onOpen,
  }: {
    commit: BlameCommit;
    continued?: boolean;
    now?: number;
    stats?: { additions: number; deletions: number };
    onOpen?: (commit: string) => void;
  } = $props();
  const title = $derived(
    commit.description.split(/\r?\n/u)[0] || "(no description)",
  );
  let open = $state(false);
  function openCommit() {
    open = false;
    onOpen?.(commit.id);
  }
</script>

<span class="commit-title">
  <HoverCard.Root bind:open openDelay={250} closeDelay={150}>
    <HoverCard.Trigger>
      {#snippet child({ props })}
        <button
          {...props}
          type="button"
          class="commit-title__trigger"
          aria-label={`${title} — ${commit.author.name}${continued ? " (continued)" : ""}`}
          onclick={openCommit}>{title}</button
        >
      {/snippet}
    </HoverCard.Trigger>
    <HoverCard.Content
      align="start"
      side="bottom"
      sideOffset={8}
      style="width:min(26rem, calc(100vw - 2rem));padding:0;"
    >
      <section class="commit-card" aria-label="Commit details">
        <div class="commit-card__summary">
          <GitCommitHorizontal aria-hidden="true" />
          <div class="commit-card__message">
            <button
              type="button"
              class="commit-card__title"
              aria-label={`Open commit details: ${title}`}
              disabled={!onOpen}
              onclick={openCommit}>{title}</button
            >
            {#if stats}
              <div class="commit-card__stats">
                <FileChangeStats
                  additions={stats.additions}
                  deletions={stats.deletions}
                />
                {#if stats.additions + stats.deletions > 0}
                  <span class="commit-card__delta" aria-hidden="true">
                    {#each Array(5) as _, index}
                      <i
                        data-added={index <
                          Math.round(
                            (5 * stats.additions) /
                              (stats.additions + stats.deletions),
                          ) || undefined}
                      ></i>
                    {/each}
                  </span>
                {/if}
              </div>
            {/if}
          </div>
        </div>
        <footer>
          <RepositoryAuthorAvatar
            name={commit.committer.name}
            email={commit.committer.email}
            size="xs"
          />
          <span
            ><b>{commit.committer.name}</b>
            <span class="commit-card__time"
              >committed <RelativeTime
                timestamp={Number(commit.committer.timestamp.millis)}
                {now}
              /></span
            ></span
          >
        </footer>
      </section>
    </HoverCard.Content>
  </HoverCard.Root>
</span>

<style>
  .commit-title {
    display: flex;
    flex: 1;
    min-width: 0;
  }
  .commit-title__trigger {
    appearance: none;
    border: 0;
    padding: 0;
    min-width: 0;
    width: 100%;
    color: inherit;
    background: transparent;
    text-align: left;
    font: inherit;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .commit-title__trigger:hover {
    color: var(--primary);
    text-decoration: underline;
  }
  .commit-title__trigger:focus-visible {
    outline: 2px solid var(--ring);
  }
  .commit-card {
    font-family: var(--font-sans, sans-serif);
  }
  .commit-card__summary {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1.25rem;
  }
  .commit-card__summary > :global(svg) {
    flex: none;
    width: 1rem;
    height: 1rem;
    margin-top: 0.25rem;
    color: var(--muted-foreground);
  }
  .commit-card__message {
    flex: 1;
    min-width: 0;
  }
  .commit-card__title {
    appearance: none;
    border: 0;
    padding: 0;
    background: transparent;
    color: var(--primary);
    text-align: left;
    cursor: pointer;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    overflow-wrap: anywhere;
    font-family: var(--font-mono, monospace);
    font-size: 1rem;
    line-height: 1.4;
    font-weight: 600;
  }
  .commit-card__title:hover {
    text-decoration: underline;
  }
  .commit-card__title:focus-visible {
    outline: 2px solid var(--ring);
  }
  .commit-card__stats {
    display: flex;
    align-items: center;
    margin-top: 0.75rem;
    gap: 0.5rem;
  }
  .commit-card__delta {
    display: inline-flex;
    gap: 2px;
  }
  .commit-card__delta i {
    width: 0.5rem;
    height: 0.5rem;
    background: var(--ui-diff-stat-removed);
  }
  .commit-card__delta i[data-added] {
    background: var(--ui-diff-stat-added);
  }
  footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.25rem;
    border-top: 1px solid var(--border);
  }
  footer > span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .commit-card__time {
    color: var(--muted-foreground);
  }
</style>
