// SPDX-License-Identifier: Apache-2.0
import { App, MemoryAppDatabase, MemoryVaultAdapter } from "@lapis-notes/api";
import { MarkdownPlugin } from "@lapis-notes/markdown";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { ConversationRepository } from "../../../src/lib/ai/conversations/conversation-repository.ts";
import { VaultTranscriptStore } from "../../../src/lib/ai/conversations/vault-transcript-store.ts";
import type { ConversationLocation } from "../../../src/lib/ai/conversations/types.ts";
import { collectAiCatalog } from "../../../src/lib/ai/catalog/inventory.ts";
import type { AiCatalogProps } from "../../../src/lib/ai/catalog/props.ts";
import type { AiHistoryProps } from "../../../src/lib/ai/history/props.ts";
import {
  DEFAULT_AI_SETTINGS,
  applyAppToolEnablement,
} from "../../../src/lib/ai/settings/ai-settings.ts";
import { BUNDLED_LAPIS_NOTES_SKILL } from "../../../src/lib/ai/skills/bundled/lapis-notes.ts";
import { registerCatalogCleanup } from "../lifecycle.ts";

export function createPanelFixture() {
  const database = new MemoryAppDatabase(crypto.randomUUID());
  const app = new App({
    version: "0.1.0-catalog",
    configPath: ".lapis/app.json",
    adapter: new MemoryVaultAdapter({
      "Notes/Welcome.md": "# Welcome",
      "Notes/.agents/skills/daily/SKILL.md":
        "---\nname: daily\ndescription: Daily notes\n---\nDaily skill body.\n",
      "Notes/.agents/commands/review.md":
        "---\ndescription: Review notes\n---\nReview $ARGUMENTS.\n",
    }),
    appDatabase: database,
    markdownRenderer: async () => {},
  });
  const repository = new ConversationRepository(
    new VaultTranscriptStore(app.vault),
  );
  const controller = getWorkspaceHostBinding(app.workspace).controller;
  let settings = { ...DEFAULT_AI_SETTINGS };
  let failAction = false;
  let failLoad = false;
  let opened = "";
  let created = "";
  let searchCalls = 0;
  let catalogCalls = 0;
  let hold = false;
  let pending: (() => void) | undefined;
  let active: ConversationLocation | null = null;
  const registrations: { dispose(): void }[] = [];
  const settingsListeners = new Set<() => void>();
  const guard = () => {
    if (!failAction) return;
    failAction = false;
    throw new Error("Fixture panel action failed");
  };
  async function held() {
    if (!hold) return;
    hold = false;
    await new Promise<void>((resolve) => {
      pending = resolve;
    });
    pending = undefined;
  }
  function registerTool(name: string) {
    registrations.push(
      app.agentTools.register(
        { pluginId: "search", source: "core", provenance: "bundled" },
        {
          name,
          description: "Search the user's Lapis Notes",
          effect: "read",
          inputSchema: { type: "object" },
          execute: async () => ({ content: [] }),
        },
      ),
    );
  }
  const history: AiHistoryProps = {
    app,
    repository,
    getScope: () => "Notes",
    getActiveConversation: () => active,
    onOpenConversation: (location) => {
      guard();
      active = location;
      opened = location.conversationId;
    },
    onNewConversation: async (scopeDir) => {
      guard();
      created = scopeDir;
      await repository.create({ scopeDir });
    },
    listConversationFolders: () => ["Notes", "Projects/Atlas"],
    searchAllConversations: async () => {
      searchCalls += 1;
      await held();
      throw new Error(
        "Fixture search index unavailable: exercise local fallback",
      );
    },
  };
  const catalog: AiCatalogProps = {
    app,
    loadCatalog: async () => {
      catalogCalls += 1;
      if (failLoad) {
        failLoad = false;
        throw new Error("Fixture catalog unavailable");
      }
      const result = await collectAiCatalog({
        tools: app.agentTools.list(),
        commands: app.agentSlashCommands.list(),
        registeredSkills: app.agentSkills.list(),
        vault: app.vault,
        bundled: [BUNDLED_LAPIS_NOTES_SKILL],
        settings,
        pluginLabel: (id) =>
          id === "ai" ? "AI" : id === "search" ? "Search" : id,
        scopeDir: "Notes",
      });
      await held();
      return result;
    },
    onToggleTool: async (tool, enabled) => {
      guard();
      settings = {
        ...settings,
        ...applyAppToolEnablement(
          settings,
          tool,
          enabled,
          app.agentTools
            .list()
            .map((entry) => ({ name: entry.tool.name, owner: entry.owner })),
        ),
      };
      for (const listener of settingsListeners) listener();
    },
    onOpenSkill: async (path) => {
      guard();
      const file = app.vault.getFileByPath(path);
      if (!file) throw new Error("Missing fixture file");
      await app.workspace.openLinkText(file.path, "");
      opened = app.workspace.getActiveFile()?.path ?? "";
    },
    subscribeSettings: (listener) => {
      settingsListeners.add(listener);
      return () => settingsListeners.delete(listener);
    },
  };
  const ready = (async () => {
    await app.vault.load();
    await app.configuration.load();
    app.plugins.registerStaticPlugins([
      { plugin: MarkdownPlugin, required: false, enabledByDefault: true },
    ]);
    await app.plugins.loadPlugins();
    for (const [index, scopeDir, title, archived] of [
      [1, "Notes", "Summarize project notes", false],
      [2, "Notes", "Archived planning chat", true],
      [3, "Projects/Atlas", "Fix parser errors", false],
      [4, "", "Plan vault release", false],
    ] as const) {
      const snapshot = await repository.create({
        scopeDir,
        id: `${index}23e4567-e89b-42d3-a456-426614174000`,
        now: "2026-08-16T10:00:00.000Z",
      });
      await repository.appendTranscript(snapshot.location, [
        {
          schemaVersion: 1,
          id: `m${index}`,
          type: "message",
          role: "user",
          text: title,
          createdAt: "2026-08-16T10:00:00.000Z",
        },
      ]);
      if (archived) await repository.archive(snapshot.location);
    }
    registerTool("notes_search");
    registrations.push(
      app.agentSlashCommands.register(
        { pluginId: "search" },
        {
          name: "search",
          description: "Search notes",
          dispatch: { kind: "tool", tool: "notes_search" },
        },
      ),
    );
    await app.workspace.changeLayout(app.workspace.getLayout());
  })();
  let shutdown: Promise<void> | undefined;
  const close = () =>
    (shutdown ??= (async () => {
      pending?.();
      try {
        await ready;
      } finally {
        for (const registration of registrations.reverse())
          registration.dispose();
        settingsListeners.clear();
        await app.fileEditingSessions.settleOperations();
        for (const plugin of [...app.plugins.plugins.values()].reverse())
          await plugin.disable();
        await app.workspace.disposeWorkspaceHost();
        await app.fileEditingSessions.dispose();
        await app.metadataCache.dispose();
        await database.close();
      }
    })());
  const unregister = registerCatalogCleanup(close);
  return {
    app,
    repository,
    history,
    catalog,
    ready,
    failNextAction: () => {
      failAction = true;
    },
    failNextLoad: () => {
      failLoad = true;
    },
    holdNext: () => {
      hold = true;
    },
    release: () => pending?.(),
    registerTool,
    inspect: () =>
      JSON.stringify({
        settings,
        opened,
        created,
        searchCalls,
        catalogCalls,
        pending: Boolean(pending),
        settingsListeners: settingsListeners.size,
        notifications: controller.notifications.transient
          .filter((entry) => entry.source === "ai")
          .map((entry) => entry.message),
      }),
    close: async () => {
      unregister();
      await close();
    },
  };
}
