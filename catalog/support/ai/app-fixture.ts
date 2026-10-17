// SPDX-License-Identifier: Apache-2.0
import { App, MemoryVaultAdapter, MemoryAppDatabase } from "@lapis-notes/api";
import { MarkdownPlugin } from "@lapis-notes/markdown";
import { SearchToolResult } from "@lapis-notes/search";
import { registerCatalogCleanup } from "../lifecycle.ts";

/** Construct during component initialization so Workspace owns its effects. */
export function createChatApp(onOpen: (path: string) => void) {
  const database = new MemoryAppDatabase(crypto.randomUUID());
  const app = new App({
    version: "0.1.0-catalog",
    configPath: ".lapis/app.json",
    adapter: new MemoryVaultAdapter({
      "Notes/alpha.md": "# Notes\n\nTODO: summarize this note.",
      "Projects/auth.md": "# Authentication\n\nhello OAuth tokens",
    }),
    appDatabase: database,
    markdownRenderer: async () => {},
  });
  const result = app.agentResultViews.register("search", {
    tool: "notes_search",
    component: SearchToolResult,
  });
  const opened = app.workspace.on("file-open", (file) => {
    if (file) onOpen(file.path);
  });
  const ready = (async () => {
    await app.vault.load();
    await app.configuration.load();
    app.plugins.registerStaticPlugins([
      { plugin: MarkdownPlugin, required: false, enabledByDefault: true },
    ]);
    await app.plugins.loadPlugins();
  })();
  let shutdown: Promise<void> | undefined;
  const close = () =>
    (shutdown ??= (async () => {
      try {
        await ready;
      } finally {
        app.workspace.offref(opened);
        result.dispose();
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
    ready,
    close: async () => {
      unregister();
      await close();
    },
  };
}
