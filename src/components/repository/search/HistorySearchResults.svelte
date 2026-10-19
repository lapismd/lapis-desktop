<script lang="ts">
  // Copied/adapted jj-store CommunitySearchCommand's grouped result layout.
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import * as ScrollArea from "@lapismd/design-core/shadcn/scroll-area";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import RepositoryComparisonTime from "../RepositoryComparisonTime.svelte";
  import Search from "@lucide/svelte/icons/search";
  import File from "@lucide/svelte/icons/file-clock";
  import Commit from "@lucide/svelte/icons/git-commit-horizontal";
  import type {
    HistorySearchHit,
    HistorySearchState,
  } from "../../../lib/repository/search.ts";
  let {
    snapshot,
    onSelect,
  }: { snapshot: HistorySearchState; onSelect(hit: HistorySearchHit): void } =
    $props();
</script>

{#if snapshot.busy && !snapshot.hits.length}<div
    class="search-skeleton"
    role="status"
    aria-label="Searching saved history"
  >
    {#each Array(5) as _}<div>
        <Skeleton class="search-skeleton-title" /><Skeleton
          class="search-skeleton-text"
        />
      </div>{/each}
  </div>{:else if !snapshot.hits.length}<Empty.Root role="status"
    ><Empty.Header
      ><Empty.Media variant="icon"><Search /></Empty.Media><Empty.Title
        >{snapshot.searched && !snapshot.next
          ? "No matching saved versions"
          : "Find an earlier version"}</Empty.Title
      ><Empty.Description
        >{snapshot.next
          ? "Continue searching older checkpoints to find more history."
          : "Search saved file contents, paths, checkpoint messages, authors and dates."}</Empty.Description
      ></Empty.Header
    ></Empty.Root
  >
{:else}<ScrollArea.Root style="flex:1;min-height:0">
    <CommandView.Root
      shouldFilter={false}
      label="Saved history results"
      class="history-search-results"
    >
      <CommandView.List>
        <CommandView.Group heading="Saved versions">
          {#each snapshot.hits as hit (`${hit.revision.checkpoint.commit}/${hit.path ?? ""}`)}
            {@const checkpoint = hit.revision.checkpoint}
            <CommandView.Item
              class="history-search-result"
              value={`${checkpoint.commit}/${hit.path ?? ""}`}
              onSelect={() => onSelect(hit)}
            >
              <CommandView.ItemIcon
                >{#if hit.path}<File aria-hidden="true" />{:else}<Commit
                    aria-hidden="true"
                  />{/if}</CommandView.ItemIcon
              >
              <CommandView.ItemLabel
                >{hit.path ??
                  checkpoint.description.split("\n")[0]}</CommandView.ItemLabel
              >
              <CommandView.ItemDescription
                >{hit.revision.author} · {checkpoint.commit.slice(
                  0,
                  12,
                )}{hit.line
                  ? ` · line ${hit.line}`
                  : ""}</CommandView.ItemDescription
              >
              <span data-ui-component="command-view" data-ui-part="trailing"
                ><RepositoryComparisonTime
                  timestamp={checkpoint.timestamp_millis}
                /></span
              >
              <span class="history-search-excerpt">{hit.excerpt}</span>
            </CommandView.Item>
          {/each}
        </CommandView.Group>
      </CommandView.List>
    </CommandView.Root>
  </ScrollArea.Root>{/if}

<style>
  .search-skeleton {
    padding: 1rem;
    display: grid;
    gap: 1.5rem;
  }
  .search-skeleton div {
    display: grid;
    gap: 0.5rem;
  }
  :global(.search-skeleton-title) {
    width: 55%;
    height: 1rem;
  }
  :global(.search-skeleton-text) {
    width: 85%;
    height: 0.75rem;
  }
  :global(.history-search-results) {
    --ui-command-view-list-max-height: none;
    --ui-command-view-list-padding: 0.75rem;
  }
  :global(.history-search-result) {
    grid-template-areas: "icon label shortcut" "icon description shortcut" ". excerpt excerpt";
    align-items: start;
    row-gap: 0.1rem;
    padding-block: 0.65rem;
  }
  .history-search-excerpt {
    display: -webkit-box;
    grid-area: excerpt;
    overflow: hidden;
    margin-top: 0.25rem;
    font-size: 0.8rem;
    line-height: 1.35;
    overflow-wrap: anywhere;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
</style>
