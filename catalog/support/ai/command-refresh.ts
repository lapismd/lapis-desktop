import {
  App,
  MemoryAppDatabase,
  MemoryVaultAdapter,
  installApplicationCompatibility,
} from "@lapis-notes/api";
import { AiPlugin } from "../../../src/components/ai/plugin/ai-plugin.ts";
import { bindAi } from "../../../src/lib/ai/plugin/services.ts";
import { NativeUserAgentsStore } from "../../../src/lib/native/ai/user-commands.ts";
import type { NativeCall } from "../../../src/lib/native/vault-client.ts";
import { FakeAgentRuntime } from "../../../tests/ai/support/fake-runtime.ts";
import { reviewLayout } from "../desktop/layout.ts";
import { registerCatalogCleanup } from "../lifecycle.ts";

const command = (description: string) =>
  `---\ndescription: ${description}\n---\n\nReview my notes.\n`;

/** Real AI plugin and Catalog; only named native IO is a disposable fixture. */
export function createCommandRefreshFixture() {
  const files = new Map([["review", command("Original review command")]]);
  let unreadable = false;
  const database = new MemoryAppDatabase(crypto.randomUUID());
  const app = new App({
    version: "0.1.0-catalog",
    configPath: ".lapis/app.json",
    adapter: new MemoryVaultAdapter({ ".lapis/app.json": "{}" }),
    appDatabase: database,
    markdownRenderer: async () => {},
    workspaceShell: { application: { name: "Lapis Notes" } },
  });
  const compatibility = installApplicationCompatibility(app);
  const call: NativeCall = async <T>(name: string, args?: unknown) => {
    if (name !== "desktop_ai_user_commands")
      throw new Error(`Unexpected command review operation: ${name}`);
    const operation = (
      args as {
        operation: { type: string; name: string; content: string };
      }
    ).operation;
    if (operation.type === "list") {
      if (unreadable) throw new Error("Review commands are unreadable");
      return {
        root: "/catalog-user/.lapis/agents/commands",
        files: [...files].map(([name, content]) => ({ name, content })),
      } as T;
    }
    if (operation.type === "exists") return files.has(operation.name) as T;
    if (operation.type === "createIfMissing" && files.has(operation.name))
      return false as T;
    files.set(operation.name, operation.content);
    return (operation.type === "createIfMissing" ? true : undefined) as T;
  };
  const store = new NativeUserAgentsStore("catalog-vault", call, (error) => {
    app.notifications.notify({
      title: "AI",
      message: error instanceof Error ? error.message : String(error),
      severity: "error",
      source: "ai",
    });
  });
  const unbind = bindAi(app, () => ({
    runtime: new FakeAgentRuntime({ id: "acp", resumeSupported: false }),
    models: { listModels: async () => [] },
    userAgents: store,
    unavailableReason: () => "Catalog review does not admit AI execution.",
    close: () => store.close(),
  }));
  const ready = (async () => {
    await app.vault.load();
    await app.configuration.load();
    app.plugins.registerStaticPlugins([
      { plugin: AiPlugin, enabledByDefault: true, distribution: "bundled" },
    ]);
    await app.plugins.loadPlugins({ communityPlugins: "disabled" });
    const layout = reviewLayout();
    const leaf = layout.main.children[0]!.children[0]!;
    leaf.state = {
      type: "ai-catalog",
      state: {},
      title: "Catalog",
      icon: "library",
    };
    await app.workspace.changeLayout(layout);
  })();
  let shutdown: Promise<void> | undefined;
  const close = () =>
    (shutdown ??= (async () => {
      try {
        await ready;
      } finally {
        await app.fileEditingSessions.settleOperations();
        for (const plugin of [...app.plugins.plugins.values()].reverse())
          await plugin.disable();
        await store.close();
        await app.workspace.disposeWorkspaceHost();
        await app.fileEditingSessions.dispose();
        await app.metadataCache.dispose();
        await database.close();
        unbind();
        compatibility();
      }
    })());
  const unregister = registerCatalogCleanup(close);
  return {
    app,
    ready,
    add: () => files.set("capture", command("New external capture command")),
    edit: () =>
      files.set("review", command("Externally updated review command")),
    remove: () => files.delete("capture"),
    fail: () => {
      unreadable = true;
    },
    recover: () => {
      unreadable = false;
      files.set("review", command("Recovered external review command"));
    },
    close: async () => {
      unregister();
      await close();
    },
  };
}
