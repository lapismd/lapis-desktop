<!-- Adapted from jj-store web/src/lib/ui/store-settings/StoreCaptureSources.svelte.
     Source efc26dea, Apache-2.0. Notes owns policy, acquisition and persistence. -->
<script lang="ts">
  import * as Table from "@lapismd/design-core/shadcn/table";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import { TagList } from "@lapismd/design-core/shadcn/tag-list";
  import DownloadIcon from "@lucide/svelte/icons/download";
  import type { ImportSourceRow } from "../../../lib/ai/imports/source-port.ts";
  let {
    rows,
    selected,
    busy,
    loading,
    onSelect,
  }: {
    rows: ImportSourceRow[];
    selected?: string;
    busy: boolean;
    loading: boolean;
    onSelect: (id: string) => void;
  } = $props();
</script>

{#if loading}
  <div
    class="source-loading"
    aria-label="Loading importable sessions"
    role="status"
  >
    {#each [1, 2, 3] as row (row)}<div class="source-loading__row">
        <Skeleton class="source-title" /><Skeleton
          class="source-status"
        /><Skeleton class="source-action" />
      </div>{/each}
  </div>
{:else if !rows.length}
  <Empty.Root
    ><Empty.Header
      ><Empty.Media variant="icon"
        ><DownloadIcon aria-hidden="true" /></Empty.Media
      ><Empty.Title>No importable sessions</Empty.Title><Empty.Description
        >Refresh to check the configured local Codex sources.</Empty.Description
      ></Empty.Header
    ></Empty.Root
  >
{:else}
  <Table.Root aria-label="Importable AI sessions">
    <Table.Header
      ><Table.Row
        ><Table.Head scope="col">Source</Table.Head><Table.Head scope="col"
          >Status</Table.Head
        ><Table.Head scope="col">Preview</Table.Head></Table.Row
      ></Table.Header
    >
    <Table.Body>
      {#each rows as source (source.selector)}
        <Table.Row
          data-state={selected === source.selector ? "selected" : undefined}
        >
          <Table.Cell
            ><div class="source-name">{source.title}</div>
            <small
              >{source.profile} ·
              <time datetime={source.updatedAt}
                >{new Date(source.updatedAt).toLocaleDateString()}</time
              ></small
            ></Table.Cell
          >
          <Table.Cell
            ><TagList
              label={`Status for ${source.title}`}
              tags={[
                {
                  id: "phase",
                  label:
                    selected === source.selector ? "Previewed" : "Available",
                  variant: "secondary",
                },
              ]}
            /></Table.Cell
          >
          <Table.Cell
            ><Button
              variant="outline"
              size="sm"
              disabled={busy}
              aria-label={`Preview ${source.title}`}
              onclick={() => onSelect(source.selector)}>Preview</Button
            ></Table.Cell
          >
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
{/if}

<style>
  .source-name {
    font-weight: 500;
    overflow-wrap: anywhere;
  }
  small {
    color: var(--muted-foreground);
  }
  .source-loading {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
  }
  .source-loading__row {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  .source-loading :global(.source-title) {
    height: 2rem;
    flex: 1;
  }
  .source-loading :global(.source-status) {
    height: 1.25rem;
    width: 5rem;
  }
  .source-loading :global(.source-action) {
    height: 2rem;
    width: 4rem;
  }
</style>
