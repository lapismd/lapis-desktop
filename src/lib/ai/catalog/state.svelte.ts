// SPDX-License-Identifier: Apache-2.0
// Retained Lapis AI Catalog; see ../NOTICE.md.
import { SvelteSet } from "svelte/reactivity";
import type { AiCatalogProps } from "./props.ts";
import type { CatalogGroup, CatalogToolRow } from "./types.ts";
import { OwnedAiWork } from "../core/owned-work.ts";
import { filterCatalogGroups } from "./filter.ts";
import {
  collectCatalogExpandableKeys,
  collectCatalogFolderKeys,
  isCatalogFolderKey,
} from "./tree.ts";
export function createCatalogState(props: AiCatalogProps) {
  const work = new OwnedAiWork();
  const { app, loadCatalog, onToggleTool, onOpenSkill, subscribeSettings } =
    props;
  let groups = $state<CatalogGroup[]>([]);
  let query = $state("");
  let openKeys = new SvelteSet<string>();
  let openedCatalogPath = $state<string | null>(null);
  let defaultsApplied = false;
  let refreshGeneration = 0;
  let groupsSignature = "";
  let active = true;
  let error = $state<string | null>(null);
  let loading = $state(false);
  const pendingTools = new SvelteSet<string>();

  const visibleGroups = $derived(filterCatalogGroups(groups, query));
  const filtering = $derived(query.trim().length > 0);
  const expandableKeys = $derived(collectCatalogExpandableKeys(visibleGroups));
  const allExpanded = $derived(
    expandableKeys.length > 0 &&
      expandableKeys.every(
        (key) => (filtering && isCatalogFolderKey(key)) || openKeys.has(key),
      ),
  );

  function isOpen(key: string): boolean {
    if (filtering && isCatalogFolderKey(key)) return true;
    return openKeys.has(key);
  }

  function setOpen(key: string, open: boolean): void {
    if (open) openKeys.add(key);
    else openKeys.delete(key);
  }

  function toggleAll(): void {
    if (allExpanded) {
      openKeys.clear();
      return;
    }
    openKeys.clear();
    for (const key of collectCatalogExpandableKeys(visibleGroups)) {
      openKeys.add(key);
    }
  }

  function report(cause: unknown) {
    if (!active) return;
    error = cause instanceof Error ? cause.message : String(cause);
    app.notifications.notify({
      title: "AI Catalog",
      message: error,
      severity: "error",
      source: "ai",
    });
  }
  function refresh(): Promise<void> {
    return work.run(loadGroups);
  }
  async function loadGroups(): Promise<void> {
    if (!active) return;
    const generation = ++refreshGeneration;
    loading = true;
    try {
      const nextGroups = await loadCatalog();
      if (!active || generation !== refreshGeneration) return;
      error = null;
      const nextSignature = JSON.stringify(nextGroups);
      if (nextSignature === groupsSignature) return;
      groupsSignature = nextSignature;
      groups = nextGroups;
      if (!defaultsApplied) {
        openKeys.clear();
        for (const key of collectCatalogFolderKeys(groups)) openKeys.add(key);
        defaultsApplied = true;
      }
    } catch (cause) {
      if (active && generation === refreshGeneration) report(cause);
    } finally {
      if (active && generation === refreshGeneration) loading = false;
    }
  }
  function mount() {
    const layout = app.workspace.on("layout-ready", () => void refresh());
    const tools = app.agentTools.on("changed", () => void refresh());
    const commands = app.agentSlashCommands.on("changed", () => void refresh());
    const skills = app.agentSkills.on("changed", () => void refresh());
    const created = app.vault.on("create", () => void refresh());
    const deleted = app.vault.on("delete", () => void refresh());
    const modified = app.vault.on("modify", () => void refresh());
    const renamed = app.vault.on("rename", () => void refresh());
    const activeLeaf = app.workspace.on(
      "active-leaf-change",
      () => void refresh(),
    );
    const unsubscribeSettings = subscribeSettings?.(() => void refresh());
    const unsubscribeCommands = props.subscribeUserCommands?.(
      () => void refresh(),
    );
    if (app.workspace.layoutReady) void refresh();
    return () => {
      active = false;
      refreshGeneration += 1;
      app.workspace.offref(layout);
      app.agentTools.offref(tools);
      app.agentSlashCommands.offref(commands);
      app.agentSkills.offref(skills);
      app.vault.offref(created);
      app.vault.offref(deleted);
      app.vault.offref(modified);
      app.vault.offref(renamed);
      app.workspace.offref(activeLeaf);
      unsubscribeSettings?.();
      unsubscribeCommands?.();
      props.onDispose?.(work.settle());
    };
  }

  function openCatalogFile(path: string): Promise<void> {
    return work.run(() => openFile(path));
  }
  async function openFile(path: string): Promise<void> {
    if (!active) return;
    error = null;
    try {
      await onOpenSkill(path);
      if (active) openedCatalogPath = path;
    } catch (cause) {
      report(cause);
    }
  }
  function toggleTool(tool: CatalogToolRow, enabled: boolean): Promise<void> {
    return work.run(() => saveTool(tool, enabled));
  }
  async function saveTool(
    tool: CatalogToolRow,
    enabled: boolean,
  ): Promise<void> {
    if (!active || pendingTools.has(tool.name)) return;
    const previous = tool.enabled;
    tool.enabled = enabled;
    pendingTools.add(tool.name);
    error = null;
    try {
      await onToggleTool(tool, enabled);
      await refresh();
    } catch (cause) {
      tool.enabled = previous;
      report(cause);
    } finally {
      pendingTools.delete(tool.name);
    }
  }
  return {
    get groups() {
      return groups;
    },
    get visibleGroups() {
      return visibleGroups;
    },
    get openedCatalogPath() {
      return openedCatalogPath;
    },
    get allExpanded() {
      return allExpanded;
    },
    get expandableKeys() {
      return expandableKeys;
    },
    get filtering() {
      return filtering;
    },
    get error() {
      return error;
    },
    get loading() {
      return loading;
    },
    get query() {
      return query;
    },
    set query(value: string) {
      query = value;
    },
    pendingTools,
    isOpen,
    setOpen,
    toggleAll,
    refresh,
    openCatalogFile,
    toggleTool,
    mount,
  };
}
export type CatalogState = ReturnType<typeof createCatalogState>;
