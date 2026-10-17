// SPDX-License-Identifier: Apache-2.0
// Retained Lapis AI History; see ../NOTICE.md.
import type { AiHistoryProps } from "./props.ts";
import type { ConversationListEntry } from "../conversations/transcript-store.ts";
import type { ConversationLocation } from "../conversations/types.ts";
import {
  FILE_EXPLORER_SELECTION_CHANGE_EVENT,
  conversationScopeFromVaultPath,
  resolveHistoryCreationScope,
  workspaceEvents,
} from "../conversations/history-creation-scope.ts";
import { formatDirectoryContextLabel } from "../conversations/scope-tree.ts";
import {
  buildConversationHistoryTree,
  conversationHistoryFolderPaths,
} from "./conversation-history-tree.ts";
import { loadHistoryEntries } from "./search.ts";
import { OwnedAiWork } from "../core/owned-work.ts";
export function createHistoryState(props: AiHistoryProps) {
  const work = new OwnedAiWork();
  const {
    app,
    repository,
    getScope,
    getActiveConversation,
    onOpenConversation,
    onNewConversation,
    searchAllConversations,
  } = props;
  let active = true;
  let scopeDir = $state("");
  let selectedScope = $state("");
  let activeConversation = $state<ConversationLocation | null>(null);
  let entries = $state<ConversationListEntry[]>([]);
  let showArchived = $state(false);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let query = $state("");
  let openScopes = $state<Set<string>>(new Set());
  let selectionInitialized = false;
  let contextLockedByTree = false;
  let refreshVersion = 0;

  const visibleEntries = $derived(
    entries.filter(
      (entry) => showArchived || entry.metadata?.status !== "archived",
    ),
  );
  const folders = $derived(buildConversationHistoryTree(visibleEntries));
  const folderPaths = $derived(conversationHistoryFolderPaths(folders));
  const allFoldersOpen = $derived(
    folderPaths.length > 0 && folderPaths.every((path) => openScopes.has(path)),
  );
  const creationScopeLabel = $derived(
    formatDirectoryContextLabel(selectedScope),
  );
  const expandFoldersLabel = $derived(
    allFoldersOpen
      ? "Collapse all conversation folders"
      : "Expand all conversation folders",
  );
  const newChatLabel = $derived(`New chat in ${creationScopeLabel}`);

  function revealScope(path: string): void {
    const next = new Set(openScopes);
    let changed = false;
    const add = (scope: string) => {
      if (next.has(scope)) return;
      next.add(scope);
      changed = true;
    };
    if (!path) add("");
    const segments = path.split("/").filter(Boolean);
    for (let index = 0; index < segments.length; index += 1) {
      add(segments.slice(0, index + 1).join("/"));
    }
    if (changed) openScopes = next;
  }

  function setFolderOpen(path: string, open: boolean): void {
    const next = new Set(openScopes);
    if (open) next.add(path);
    else next.delete(path);
    openScopes = next;
  }

  function selectFolder(path: string): void {
    selectedScope = path;
    contextLockedByTree = true;
  }

  function applyCreationScope(
    path: string,
    source: "workspace" | "tree",
  ): void {
    if (selectedScope !== path) selectedScope = path;
    contextLockedByTree = source === "tree";
    revealScope(path);
  }

  function toggleAllFolders(): void {
    openScopes = allFoldersOpen ? new Set() : new Set(folderPaths);
  }

  function refresh(followActiveScope = false): Promise<void> {
    return work.run(() => loadEntries(followActiveScope));
  }
  async function loadEntries(followActiveScope: boolean): Promise<void> {
    if (!active) return;
    const version = ++refreshVersion;
    const nextScope = getScope();
    if (scopeDir !== nextScope) scopeDir = nextScope;
    const nextActiveConversation = getActiveConversation();
    if (
      activeConversation?.scopeDir !== nextActiveConversation?.scopeDir ||
      activeConversation?.conversationId !==
        nextActiveConversation?.conversationId
    ) {
      activeConversation = nextActiveConversation;
    }
    if (followActiveScope || !selectionInitialized) {
      if (!contextLockedByTree) {
        applyCreationScope(
          resolveHistoryCreationScope(app, nextScope),
          "workspace",
        );
      } else {
        revealScope(selectedScope);
      }
      selectionInitialized = true;
    }
    if (!loading) loading = true;
    if (error !== null) error = null;
    try {
      const next = await loadHistoryEntries(
        repository,
        query,
        searchAllConversations,
      );
      if (active && version === refreshVersion) entries = next;
    } catch (cause) {
      if (active && version === refreshVersion) {
        error = cause instanceof Error ? cause.message : String(cause);
      }
    } finally {
      if (active && version === refreshVersion) loading = false;
    }
  }

  function runAction(action: () => void | Promise<void>): Promise<void> {
    return work.run(() => performAction(action));
  }
  async function performAction(
    action: () => void | Promise<void>,
  ): Promise<void> {
    if (!active) return;
    error = null;
    try {
      await action();
    } catch (cause) {
      if (!active) return;
      error = cause instanceof Error ? cause.message : String(cause);
      app.notifications.notify({
        title: "AI conversations",
        message: error,
        severity: "error",
        source: "ai",
      });
    }
  }
  const setArchived = (entry: ConversationListEntry, archived: boolean) =>
    runAction(async () => {
      await repository.archive(entry.location, archived);
      await refresh();
    });
  const remove = (entry: ConversationListEntry) =>
    runAction(async () => {
      await repository.delete(entry.location);
      await refresh();
    });
  const openConversation = (location: ConversationLocation) =>
    runAction(() => onOpenConversation(location));
  const newConversation = () =>
    runAction(() => onNewConversation(selectedScope));
  function updateQuery(value: string): void {
    query = value;
    void refresh();
  }

  function mount() {
    const refreshFromWorkspace = () => {
      queueMicrotask(() => void refresh(true));
    };
    const refreshFromVault = () => void refresh();
    const applyExplorerSelection = (path: unknown) => {
      if (typeof path !== "string") return;
      applyCreationScope(
        conversationScopeFromVaultPath(app, path),
        "workspace",
      );
    };
    const events = workspaceEvents(app);
    const unsubscribe = repository.subscribe(() => void refresh());
    const activeLeaf = app.workspace.on(
      "active-leaf-change",
      refreshFromWorkspace,
    );
    const explorerSelection = events.on(
      FILE_EXPLORER_SELECTION_CHANGE_EVENT,
      applyExplorerSelection,
    );
    const created = app.vault.on("create", refreshFromVault);
    const deleted = app.vault.on("delete", refreshFromVault);
    const modified = app.vault.on("modify", refreshFromVault);
    const renamed = app.vault.on("rename", refreshFromVault);
    void refresh(true);
    return () => {
      active = false;
      refreshVersion += 1;
      unsubscribe();
      app.workspace.offref(activeLeaf);
      events.offref(explorerSelection);
      app.vault.offref(created);
      app.vault.offref(deleted);
      app.vault.offref(modified);
      app.vault.offref(renamed);
      props.onDispose?.(work.settle());
    };
  }
  return {
    get scopeDir() {
      return scopeDir;
    },
    get selectedScope() {
      return selectedScope;
    },
    get activeConversation() {
      return activeConversation;
    },
    get entries() {
      return entries;
    },
    get loading() {
      return loading;
    },
    get error() {
      return error;
    },
    get query() {
      return query;
    },
    get openScopes() {
      return openScopes;
    },
    get folders() {
      return folders;
    },
    get folderPaths() {
      return folderPaths;
    },
    get allFoldersOpen() {
      return allFoldersOpen;
    },
    get creationScopeLabel() {
      return creationScopeLabel;
    },
    get expandFoldersLabel() {
      return expandFoldersLabel;
    },
    get newChatLabel() {
      return newChatLabel;
    },
    get showArchived() {
      return showArchived;
    },
    set showArchived(value: boolean) {
      showArchived = value;
    },
    refresh,
    setArchived,
    remove,
    openConversation,
    newConversation,
    updateQuery,
    setFolderOpen,
    selectFolder,
    toggleAllFolders,
    mount,
  };
}
export type HistoryState = ReturnType<typeof createHistoryState>;
