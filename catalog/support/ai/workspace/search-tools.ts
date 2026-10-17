// SPDX-License-Identifier: Apache-2.0
import { Plugin, type App } from "@lapis-notes/api";
/** Public real registries supply the retained Catalog's Search contribution. */
export class SearchFixturePlugin extends Plugin {
  constructor(app: App) {
    super(app, {
      id: "search",
      name: "Search",
      version: "0.1.0",
      minAppVersion: "0.0.1",
      author: "Catalog",
      description: "Disposable registry contributions.",
    });
  }
  onload(): void {
    this.registerAgentTool({
      name: "notes_search",
      description: "Search the user's Lapis Notes",
      effect: "read",
      inputSchema: { type: "object" },
      execute: async () => ({ content: [] }),
    });
    this.registerAgentSlashCommand({
      name: "search",
      description: "Search notes",
      dispatch: { kind: "tool", tool: "notes_search" },
    });
  }
}
