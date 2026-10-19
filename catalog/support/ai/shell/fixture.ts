// SPDX-License-Identifier: Apache-2.0
// Retained App-backed shell composition; see src/lib/ai/NOTICE.md.
import {
  App,
  MemoryAppDatabase,
  MemoryVaultAdapter,
  installApplicationCompatibility,
} from "@lapis-notes/api";
import { FileExplorerPlugin } from "@lapis-notes/file-explorer";
import { SourceEditorPlugin } from "@lapis-notes/source-editor";
import editorStyles from "@lapis-notes/source-editor/styles.css?inline";
import { MarkdownPlugin } from "@lapis-notes/markdown";
import markdownStyles from "@lapis-notes/markdown/styles.css?inline";
import { SearchPlugin } from "@lapis-notes/search";
import searchStyles from "@lapis-notes/search/styles.css?inline";
import { AiPlugin } from "../../../../src/components/ai/plugin/ai-plugin.ts";
import { bindAi } from "../../../../src/lib/ai/plugin/services.ts";
import { FakeAgentRuntime } from "../../../../tests/ai/support/fake-runtime.ts";
import { shellSeed } from "./seed.ts";
import type { ShellScenario } from "./types.ts";
import { registerCatalogCleanup } from "../../lifecycle.ts";
import { registerChatReview } from "../sessions/chat-review-view.ts";
import { chatReviewSeed } from "../sessions/chat-review-seed.ts";
import { SendingErrorRuntime } from "../sessions/sending-error-runtime.ts";
export function createShellFixture(
  scenario: ShellScenario,
  reviewLayout = false,
  longMessages = false,
  holdRunning = false,
) {
  const files = shellSeed(
    undefined,
    scenario === "sending-error" || scenario === "send-failure"
      ? "registry-chat"
      : scenario,
  );
  const database = new MemoryAppDatabase(crypto.randomUUID());
  const app = new App({
    version: "0.1.0-catalog",
    configPath: ".lapis/app.json",
    adapter: new MemoryVaultAdapter(
      reviewLayout ? chatReviewSeed(files, longMessages) : files,
    ),
    appDatabase: database,
    markdownRenderer: async () => {},
    workspaceShell: { application: { name: "Lapis Notes" } },
  });
  const compatibility = installApplicationCompatibility(app);
  let releaseModels!: () => void;
  const modelsReady = new Promise<void>((resolve) => {
    releaseModels = resolve;
  });
  if (scenario !== "initializing") releaseModels();
  const runtimes: FakeAgentRuntime[] = [];
  const releaseAi = bindAi(app, () => {
    const runtime =
      scenario === "sending-error" || scenario === "send-failure"
        ? new SendingErrorRuntime({ id: "acp", trace: "rich" })
        : new FakeAgentRuntime({
            id: "acp",
            trace: "rich",
            requireApproval: holdRunning,
          });
    runtimes.push(runtime);
    return {
      runtime,
      models: {
        listModels: async (provider) => {
          await modelsReady;
          return (
            provider === "cursor"
              ? ["composer-2.5"]
              : provider === "opencode"
                ? ["anthropic/claude-sonnet-4-5"]
                : ["gpt-5.6-sol", "gpt-5.6-terra"]
          ).map((model, index) => ({
            provider,
            model,
            isDefault: index === 0,
          }));
        },
      },
      unavailableReason: () => null,
      close: async () => {
        for (const session of runtime.sessions) await session.close();
      },
    };
  });
  const community =
    scenario === "community-tools"
      ? app.agentTools.register(
          {
            pluginId: "story-community",
            source: "community",
            provenance: "community",
          },
          {
            name: "story_word_count",
            description: "Count words in a scoped note.",
            effect: "read",
            inputSchema: { type: "object" },
            outputSchema: { type: "object" },
            execute: async () => ({
              content: [{ type: "text", text: "42 words" }],
              structuredContent: { words: 42 },
            }),
          },
        )
      : undefined;
  let stopMetadata: (() => void) | undefined;
  const ready = (async () => {
    await app.vault.load();
    await app.configuration.load();
    app.plugins.registerStaticPlugins([
      {
        plugin: SourceEditorPlugin,
        styles: editorStyles,
        required: false,
        enabledByDefault: true,
      },
      {
        plugin: MarkdownPlugin,
        styles: markdownStyles,
        required: false,
        enabledByDefault: true,
        distribution: "bundled",
      },
      {
        plugin: FileExplorerPlugin,
        required: false,
        enabledByDefault: true,
        distribution: "bundled",
      },
      {
        plugin: SearchPlugin,
        styles: searchStyles,
        required: false,
        enabledByDefault: true,
        distribution: "bundled",
      },
      {
        plugin: AiPlugin,
        required: false,
        enabledByDefault: true,
        distribution: "bundled",
      },
    ]);
    await app.plugins.loadPlugins({
      communityPlugins: "disabled",
      optionalCorePlugins: "configured",
    });
    if (reviewLayout && scenario === "sending-error")
      registerChatReview(app, true);
    stopMetadata = app.metadataTypeManager.trackChanges();
    await app.metadataCache.load();
    const search = app.plugins.plugins.get("search");
    if (search instanceof SearchPlugin) await search.refreshIndex("ai-shell");
    await app.workspace.loadLayout();
    if (scenario === "local-conversations" || scenario === "follow-scope") {
      const note = app.vault.getFileByPath(
        scenario === "follow-scope" ? "Projects/work.md" : "Notes/Welcome.md",
      );
      const ai = app.workspace.getLeavesOfType("ai")[0];
      if (!note || !ai)
        throw new Error("The retained shell has no initial scope");
      const leaf = app.workspace.getLeaf("tab");
      await leaf.openFile(note);
      app.workspace.activateLeaf(leaf, { saveLayout: false });
      app.workspace.getActiveFile();
      const plugin = app.plugins.plugins.get("ai");
      if (plugin instanceof AiPlugin)
        plugin.application.currentConversationScope();
      app.workspace.activateLeaf(ai, { saveLayout: false });
      if (scenario !== "follow-scope") leaf.close();
    }
  })();
  let closing: Promise<void> | undefined;
  const close = () =>
    (closing ??= (async () => {
      releaseModels();
      const errors: unknown[] = [];
      const step = async (work: () => unknown) => {
        try {
          await work();
        } catch (error) {
          errors.push(error);
        }
      };
      await step(() => ready);
      await step(() => app.fileEditingSessions.settleOperations());
      for (const plugin of [...app.plugins.plugins.values()].reverse())
        await step(() => plugin.disable());
      await step(() => community?.dispose());
      await step(() => stopMetadata?.());
      await step(() => app.workspace.disposeWorkspaceHost());
      await step(() => app.fileEditingSessions.dispose());
      await step(() => app.metadataCache.dispose());
      await step(() => database.close());
      await step(releaseAi);
      await step(compatibility);
      if (errors.length)
        throw new AggregateError(errors, "AI shell cleanup failed");
    })());
  const unregister = registerCatalogCleanup(close);
  return {
    app,
    ready,
    releaseModels,
    runtimes,
    async close() {
      unregister();
      await close();
    },
  };
}
type ShellFixture = ReturnType<typeof createShellFixture>;
const fixtures = new WeakMap<HTMLElement, ShellFixture>();
export function registerShellFixture(
  root: HTMLElement,
  fixture: ShellFixture,
): () => void {
  fixtures.set(root, fixture);
  return () => {
    if (fixtures.get(root) === fixture) fixtures.delete(root);
  };
}
export function shellFixture(element: HTMLElement): ShellFixture {
  const root = element.querySelector<HTMLElement>(
    '[data-testid="ai-shell-demo"]',
  );
  const fixture = root && fixtures.get(root);
  if (!fixture) throw new Error("No owned AI shell fixture");
  return fixture;
}
