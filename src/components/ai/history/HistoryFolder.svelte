<!-- SPDX-License-Identifier: Apache-2.0; retained Lapis AI History, see ../../../lib/ai/NOTICE.md. -->
<script lang="ts">
  import { useTextHighlight } from "@lapis-notes/api";
  import * as Collapsible from "@lapismd/design-core/shadcn/collapsible";
  import * as Sidebar from "@lapismd/design-core/shadcn/sidebar";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import FolderOpenIcon from "@lucide/svelte/icons/folder-open";
  import FolderClosedIcon from "@lucide/svelte/icons/folder-closed";
  import HistoryFolder from "./HistoryFolder.svelte";
  import HistoryConversation from "./HistoryConversation.svelte";
  import { entryKey } from "../../../lib/ai/history/entry.ts";
  import type { HistoryState } from "../../../lib/ai/history/state.svelte.ts";
  import type { ConversationHistoryFolder } from "../../../lib/ai/history/conversation-history-tree.ts";
  let {
    folder,
    history,
    level = 1,
    nested = false,
  }: {
    folder: ConversationHistoryFolder;
    history: HistoryState;
    level?: number;
    nested?: boolean;
  } = $props();

  const Item = $derived(nested ? Sidebar.MenuSubItem : Sidebar.MenuItem);
  const open = $derived(
    history.query.trim() ? true : history.openScopes.has(folder.path),
  );
</script>

<Item role="none" class="ai-history__folder-item">
  <Collapsible.Root
    {open}
    onOpenChange={(value) => history.setFolderOpen(folder.path, value)}
  >
    <Collapsible.Trigger
      class="ai-history__folder-row"
      role="treeitem"
      aria-level={level}
      aria-selected={folder.path === history.selectedScope}
      aria-expanded={open}
      aria-label={`${folder.path || "Vault root"}, ${folder.conversationCount} conversation${folder.conversationCount === 1 ? "" : "s"}`}
      data-active-folder={folder.path === history.selectedScope}
      onclick={() => history.selectFolder(folder.path)}
    >
      <ChevronRightIcon
        class="ai-history__disclosure"
        data-open={open}
        aria-hidden="true"
      />
      {#if open}
        <FolderOpenIcon class="ai-history__folder-icon" aria-hidden="true" />
      {:else}
        <FolderClosedIcon class="ai-history__folder-icon" aria-hidden="true" />
      {/if}
      <span
        class="ai-history__folder-label"
        use:useTextHighlight={{ query: history.query, value: folder.name }}
        >{folder.name}</span
      >
      <Sidebar.MenuBadge class="ai-history__count">
        {folder.conversationCount}
      </Sidebar.MenuBadge>
    </Collapsible.Trigger>
    <Collapsible.Content>
      <Sidebar.MenuSub role="group" class="ai-history__subtree">
        {#each folder.children as child (child.path)}
          <HistoryFolder folder={child} level={level + 1} nested {history} />
        {/each}
        {#each folder.conversations as entry (entryKey(entry))}
          <HistoryConversation {entry} level={level + 1} {history} />
        {/each}
      </Sidebar.MenuSub>
    </Collapsible.Content>
  </Collapsible.Root>
</Item>
