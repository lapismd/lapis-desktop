// SPDX-License-Identifier: Apache-2.0
import type { Plugin } from "@lapis-notes/api";
import type { AiApplication } from "../../../lib/ai/plugin/application.ts";
import { AiView } from "../views/ai-view.ts";
import { AiHistoryView } from "../views/history-view.ts";
import { AiCatalogView } from "../views/catalog-view.ts";
import { AiJsonlView } from "../views/jsonl-view.ts";
import { AiImportView } from "../views/import-view.ts";
import {
  AI_VIEW,
  AI_HISTORY_VIEW,
  AI_CATALOG_VIEW,
  AI_JSONL_VIEW,
  AI_IMPORT_VIEW,
} from "../../../lib/ai/plugin/view-types.ts";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import {
  AI_CONVERSATION_PALETTE_PROVIDER_ID,
  AI_CONVERSATION_PALETTE_TAB,
  conversationPaletteItem,
} from "../../../lib/ai/conversations/conversation-palette.ts";
export function registerAiViews(plugin: Plugin, host: AiApplication): void {
  plugin.registerView(AI_JSONL_VIEW, (leaf) => new AiJsonlView(leaf, host), {
    kind: "file",
  });
  plugin.registerEditorView({
    id: AI_JSONL_VIEW,
    viewType: AI_JSONL_VIEW,
    label: "AI JSONL",
    description: "Read-only chat and event preview for JSON Lines files.",
    filenamePatterns: [".jsonl", "*.jsonl"],
    priority: "default",
  });
  plugin.registerExtensions(["jsonl"], AI_JSONL_VIEW);
  const perform = (action: () => Promise<void>) => {
    if (!host.active) return;
    void host.operations.track(action()).catch((error) => host.report(error));
  };
  const importCommand = {
    id: "open-import-sessions" as const,
    name: "Open Import AI sessions" as const,
    callback: () =>
      perform(async () => {
        const existing =
          plugin.app.workspace.getLeavesOfType(AI_IMPORT_VIEW)[0];
        const leaf = existing ?? plugin.app.workspace.getLeaf("tab");
        if (!existing)
          await leaf.setViewState({ type: AI_IMPORT_VIEW, state: {} });
        await plugin.app.workspace.revealLeaf(leaf);
      }),
  };
  plugin.registerView(AI_IMPORT_VIEW, (leaf) => new AiImportView(leaf, host), {
    kind: "command",
    command: importCommand,
  });
  plugin.registerSidebarView(
    AI_VIEW,
    (leaf) => new AiView(leaf, host),
    { side: "right", title: "AI", icon: "sparkles" },
    {
      kind: "command",
      command: {
        id: "open-chat",
        name: "Open Chat",
        callback: () => perform(() => host.openAiConversation()),
      },
    },
  );
  plugin.registerSidebarView(
    AI_HISTORY_VIEW,
    (leaf) => new AiHistoryView(leaf, host),
    { side: "right", title: "AI conversations", icon: "history" },
    {
      kind: "command",
      command: {
        id: "open-history",
        name: "Open History",
        callback: () => perform(() => host.revealConversationHistory()),
      },
    },
  );
  plugin.registerSidebarView(
    AI_CATALOG_VIEW,
    (leaf) => new AiCatalogView(leaf, host),
    { side: "left", title: "Catalog", icon: "library" },
    {
      kind: "command",
      command: {
        id: "open-catalog",
        name: "Open Catalog",
        callback: () => perform(() => host.revealAiCatalog()),
      },
    },
  );
  plugin.addRibbonIcon("sparkles", "Open Chat", () =>
    perform(() => host.openAiConversation()),
  );
  const { controller } = getWorkspaceHostBinding(plugin.app.workspace);
  plugin.register(
    controller.commands.registerPaletteProvider({
      id: AI_CONVERSATION_PALETTE_PROVIDER_ID,
      tab: AI_CONVERSATION_PALETTE_TAB,
      emptyQueryLimit: 5,
      search: async (query) =>
        (await host.searchAiConversations(query)).map((entry) => ({
          ...conversationPaletteItem(entry),
          run: () => perform(() => host.openAiConversation(entry.location)),
        })),
    }),
  );
}
