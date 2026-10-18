<script lang="ts">
  import { onMount } from "svelte";
  import type { LocalGraphCommit } from "@lapismd/jj-history";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { TagList } from "@lapismd/design-core/shadcn/tag-list";
  import { formatRelativeTime } from "@lapismd/design-core/shadcn/relative-time";
  import ReviewAuthorAvatar from "../../../../src/components/repository/RepositoryAuthorAvatar.svelte";
  import { encodeJjChangeId } from "../../../../src/lib/repository/graph/repository-log-graph.ts";
  import { repositoryCommitTags } from "../../../../src/lib/repository/tags.ts";
  let { target, commit }: { target: string; commit?: LocalGraphCommit } =
    $props();
  let now = $state(Date.now());
  onMount(() => {
    const timer = setInterval(() => {
      now = Date.now();
    }, 30_000);
    return () => clearInterval(timer);
  });
  const time = $derived(
    commit
      ? formatRelativeTime(Number(commit.author.timestamp.millis), { now })
      : undefined,
  );
  const tags = $derived(repositoryCommitTags(commit));
  const change = $derived(commit ? encodeJjChangeId(commit.change_id) : "");
</script>

<div class="commit-target">
  <ReviewAuthorAvatar
    name={commit?.author.name ?? "Unknown author"}
    email={commit?.author.email}
    size="md"
  />
  <div class="commit-target-body">
    <div class="commit-target-summary">
      <span class="commit-target-message" title={commit?.description}>
        {commit?.description.split("\n")[0] ||
          (target ? "Parent details unavailable" : "Choose a parent")}
      </span>
      <div class="commit-target-metadata">
        {#if commit}<span title={commit.author.email}>{commit.author.name}</span
          >{/if}
        {#if time}<time datetime={time.datetime} title={time.full}
            >{time.text}</time
          >{/if}
      </div>
      <TagList
        {tags}
        label="Revision tags"
        onclick={(event) => event.stopPropagation()}
        onpointerdown={(event) => event.stopPropagation()}
        onkeydown={(event) => {
          if (event.key === "Enter" || event.key === " ")
            event.stopPropagation();
        }}
      />
    </div>
    <div class="commit-target-ids" aria-label="Revision identifiers">
      {#if target}<span title={`Git commit SHA ${target}`}
          ><Badge variant="secondary">GIT</Badge><code
            >{target.slice(0, 5)}</code
          ></span
        >{/if}
      {#if change}<span title={`JJ Change ID ${change}`}
          ><Badge variant="secondary">JJ</Badge><code>{change.slice(0, 5)}</code
          ></span
        >{/if}
    </div>
  </div>
</div>

<style>
  .commit-target {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    width: 100%;
    min-width: 0;
    align-items: center;
    gap: 0.5rem;
    color: inherit;
    text-align: start;
  }
  .commit-target-body {
    display: grid;
    min-width: 0;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.5rem;
  }
  .commit-target-summary {
    display: grid;
    min-width: 0;
    gap: 0.15rem;
  }
  .commit-target-message {
    min-width: 0;
    overflow: hidden;
    font-size: 0.875rem;
    font-weight: 550;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .commit-target-metadata {
    display: flex;
    min-width: 0;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem;
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }
  time {
    white-space: nowrap;
  }
  .commit-target-ids {
    display: grid;
    grid-template-columns: 4.5rem;
    grid-template-rows: repeat(2, minmax(1rem, auto));
    align-items: center;
    gap: 0.35rem;
  }
  .commit-target-ids > span {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 0.2rem;
  }
  .commit-target-ids :global([data-ui-component="badge"]) {
    width: 1.5rem;
    flex-shrink: 0;
    justify-content: center;
    padding-inline: 0;
    font-size: 0.625rem;
  }
  code {
    font-size: 0.75rem;
  }
</style>
