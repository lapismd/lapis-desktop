<!-- SPDX-License-Identifier: Apache-2.0; CommunityInboxSessions port, jj-store 08b58c7e. -->
<script lang="ts">
  import { untrack } from "svelte";
  import * as Collapsible from "@lapismd/design-core/shadcn/collapsible";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import FolderIcon from "@lucide/svelte/icons/folder-git-2";
  import ChevronIcon from "@lucide/svelte/icons/chevron-right";
  import MessagesIcon from "@lucide/svelte/icons/messages-square";
  import AiSessionRow from "./AiSessionRow.svelte";
  import type { SessionItem } from "../../../lib/ai/session-browser/model.ts";
  let {
    items,
    activeId,
    loading,
    busy,
    label,
    action,
    emptyTitle,
    emptyDescription,
    onSelect,
  }: {
    items: SessionItem[];
    activeId?: string;
    loading: boolean;
    busy: boolean;
    label: string;
    action: string;
    emptyTitle: string;
    emptyDescription: string;
    onSelect: (id: string) => void;
  } = $props();
  const groups = $derived(
    [...new Set(items.map((i) => i.group))].map((name) => ({
      name,
      items: items.filter((i) => i.group === name),
    })),
  );
  let openGroups = $state<Record<string, boolean>>({});
  let revealedId: string | undefined;
  $effect(() => {
    const id = activeId;
    const group = groups.find((g) => g.items.some((i) => i.id === id));
    if (group && id !== revealedId)
      untrack(() => {
        revealedId = id;
        openGroups = { ...openGroups, [group.name]: true };
      });
  });
</script>

{#if loading}
  <div
    class="session-tree"
    role="status"
    aria-label={`Loading ${label.toLowerCase()}`}
    aria-busy="true"
  >
    <div aria-hidden="true">
      {#each [3, 2] as count, index (index)}
        <Skeleton class="session-skeleton-header" />
        <div class="session-tree__children">
          {#each Array(count) as _, row (row)}
            <div class="session-skeleton-row">
              <Skeleton class="session-skeleton-avatar" />
              <div class="session-skeleton-text">
                <Skeleton class="session-skeleton-name" /><Skeleton
                  class="session-skeleton-context"
                />
              </div>
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>
{:else if groups.length}
  <nav aria-label={label} class="session-tree">
    {#each groups as group (group.name)}
      {@const open = openGroups[group.name] ?? true}
      <Collapsible.Root
        {open}
        onOpenChange={(value) =>
          (openGroups = { ...openGroups, [group.name]: value })}
        role="group"
        aria-label={group.name}
      >
        <div class="session-tree__header">
          <Collapsible.Trigger>
            {#snippet child({ props })}
              <Button
                {...props}
                variant="ghost"
                class="session-tree__group"
                title={group.name}
              >
                <FolderIcon data-icon="inline-start" aria-hidden="true" /><span
                  >{group.name}</span
                >
                <ChevronIcon data-icon="inline-end" aria-hidden="true" />
              </Button>
            {/snippet}
          </Collapsible.Trigger>
        </div>
        <Collapsible.Content>
          <div class="session-tree__children">
            {#each group.items as item (item.id)}
              <AiSessionRow
                {item}
                active={item.id === activeId}
                disabled={busy}
                {action}
                onSelect={() => onSelect(item.id)}
              />
            {/each}
          </div>
        </Collapsible.Content>
      </Collapsible.Root>
    {/each}
  </nav>
{:else}
  <Empty.Root
    ><Empty.Header
      ><Empty.Media variant="icon"
        ><MessagesIcon aria-hidden="true" /></Empty.Media
      ><Empty.Title>{emptyTitle}</Empty.Title><Empty.Description
        >{emptyDescription}</Empty.Description
      ></Empty.Header
    ></Empty.Root
  >
{/if}

<style>
  .session-tree {
    display: grid;
    min-width: 0;
    grid-template-columns: minmax(0, 1fr);
    gap: 0.25rem;
    padding: 0.5rem;
  }
  .session-tree__header {
    display: flex;
    min-width: 0;
    align-items: center;
    padding-inline-end: 0.25rem;
    border-radius: var(--ui-button-radius, calc(var(--radius) * 0.8));
    background: var(--muted);
  }
  .session-tree__header:hover,
  .session-tree__header:focus-within {
    background: color-mix(in srgb, var(--foreground) 4%, var(--muted));
  }
  .session-tree__header :global(.session-tree__group) {
    --ui-button-height: 2.25rem;
    --ui-button-gap: 0.65rem;
    --ui-button-padding-inline: 0.625rem;
    width: 100%;
    min-width: 0;
    flex: 1;
    justify-content: flex-start;
    text-align: start;
    background: transparent;
  }
  .session-tree__header :global(.session-tree__group > span) {
    min-width: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .session-tree__header
    :global(.session-tree__group[aria-expanded="true"] > svg:last-child) {
    rotate: 90deg;
  }
  .session-tree__children {
    display: grid;
    gap: 0.25rem;
    padding: 0.25rem 0 0.25rem 1rem;
  }
  .session-tree :global(.session-skeleton-header) {
    height: 2.25rem;
    width: 100%;
  }
  .session-skeleton-row {
    box-sizing: border-box;
    display: grid;
    min-height: 3.25rem;
    grid-template-columns: 1.5rem minmax(0, 1fr);
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.625rem;
  }
  .session-tree :global(.session-skeleton-avatar) {
    width: 1.5rem;
    height: 1.5rem;
  }
  .session-skeleton-text {
    display: grid;
    gap: 0.125rem;
    min-width: 0;
  }
  .session-tree :global(.session-skeleton-name) {
    width: 45%;
    height: 1rem;
  }
  .session-tree :global(.session-skeleton-context) {
    width: 80%;
    height: 0.875rem;
  }
</style>
