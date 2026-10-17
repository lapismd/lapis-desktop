<!-- SPDX-License-Identifier: Apache-2.0; retained Lapis AI History, see ../../../lib/ai/NOTICE.md. -->
<script lang="ts">
  import { useTextHighlight } from "@lapis-notes/api";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import * as Sidebar from "@lapismd/design-core/shadcn/sidebar";
  import ArchiveIcon from "@lucide/svelte/icons/archive";
  import ArchiveRestoreIcon from "@lucide/svelte/icons/archive-restore";
  import MessageSquareIcon from "@lucide/svelte/icons/message-square";
  import MoreHorizontalIcon from "@lucide/svelte/icons/ellipsis";
  import TrashIcon from "@lucide/svelte/icons/trash-2";
  import { formatChatTimestamp } from "../../../lib/ai/chat/chat-time.ts";
  import { sameLocation } from "../../../lib/ai/history/entry.ts";
  import type { ConversationListEntry } from "../../../lib/ai/conversations/transcript-store.ts";
  import type { HistoryState } from "../../../lib/ai/history/state.svelte.ts";
  let {
    entry,
    level,
    history,
  }: { entry: ConversationListEntry; level: number; history: HistoryState } =
    $props();

  const title = $derived(entry.metadata?.title ?? "Untitled conversation");
  const current = $derived(
    sameLocation(history.activeConversation, entry.location),
  );
</script>

<Sidebar.MenuSubItem role="none" class="ai-history__conversation-item">
  <div
    class="ai-history__conversation-row"
    role="treeitem"
    aria-level={level}
    aria-selected={current}
    data-active={current}
  >
    <button
      class="ai-history__open"
      type="button"
      disabled={Boolean(entry.unavailableReason)}
      onclick={() => void history.openConversation(entry.location)}
    >
      <MessageSquareIcon class="ai-history__chat-icon" aria-hidden="true" />
      <span class="ai-history__conversation-copy">
        <span
          class="ai-history__conversation-title"
          use:useTextHighlight={{ query: history.query, value: title }}
          >{title}</span
        >
        {#if entry.preview}
          <span
            class="ai-history__preview"
            use:useTextHighlight={{
              query: history.query,
              value: entry.preview,
            }}>{entry.preview}</span
          >
        {:else}
          <span class="ai-history__timestamp">
            {entry.unavailableReason ??
              (entry.metadata
                ? formatChatTimestamp(entry.metadata.updatedAt)
                : "Unavailable")}
          </span>
        {/if}
      </span>
      {#if entry.metadata?.status === "archived"}
        <Badge variant="outline" class="ai-history__archived">Archived</Badge>
      {/if}
    </button>
    {#if entry.metadata}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props }: { props: Record<string, unknown> })}
            <Button
              {...props}
              size="icon-xs"
              variant="ghost"
              class="ai-history__conversation-actions"
              aria-label={`Conversation actions for ${title}`}
            >
              <MoreHorizontalIcon data-icon="inline-start" aria-hidden="true" />
            </Button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <DropdownMenu.Group>
            <DropdownMenu.Item
              onSelect={() =>
                void history.setArchived(
                  entry,
                  entry.metadata?.status !== "archived",
                )}
            >
              {#if entry.metadata.status === "archived"}
                <ArchiveRestoreIcon
                  data-icon="inline-start"
                  aria-hidden="true"
                />
                Restore
              {:else}
                <ArchiveIcon data-icon="inline-start" aria-hidden="true" />
                Archive
              {/if}
            </DropdownMenu.Item>
            <DropdownMenu.Item onSelect={() => void history.remove(entry)}>
              <TrashIcon data-icon="inline-start" aria-hidden="true" />
              Delete
            </DropdownMenu.Item>
          </DropdownMenu.Group>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    {/if}
  </div>
</Sidebar.MenuSubItem>
