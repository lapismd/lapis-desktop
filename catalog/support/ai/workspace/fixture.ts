// SPDX-License-Identifier: Apache-2.0
import {
  App,
  MemoryAppDatabase,
  MemoryVaultAdapter,
  installApplicationCompatibility,
} from "@lapis-notes/api";
import { SourceEditorPlugin } from "@lapis-notes/source-editor";
import { MarkdownPlugin } from "@lapis-notes/markdown";
import markdownStyles from "@lapis-notes/markdown/styles.css?inline";
import sourceEditorStyles from "@lapis-notes/source-editor/styles.css?inline";
import { AiPlugin } from "../../../../src/components/ai/plugin/ai-plugin.ts";
import { bindAi } from "../../../../src/lib/ai/plugin/services.ts";
import { aiEnabledByDefault } from "../../../../src/lib/ai/plugin/preferences.ts";
import { normalRecovery } from "../../../../src/lib/notes/startup-recovery.ts";
import { pluginLoadOptions } from "../../../../src/lib/notes/plugin-policy.ts";
import { ConversationRepository } from "../../../../src/lib/ai/conversations/conversation-repository.ts";
import { VaultTranscriptStore } from "../../../../src/lib/ai/conversations/vault-transcript-store.ts";
import { FakeAgentRuntime } from "../../../../tests/ai/support/fake-runtime.ts";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import {
  aiPanelLayout,
  AI_PANEL_TYPES,
  type AiPanelKind,
  type AiPanelLayout,
} from "./layout.ts";
import { SearchFixturePlugin } from "./search-tools.ts";
import { files, seedConversations } from "./seeds.ts";
import { registerCatalogCleanup } from "../../lifecycle.ts";
export type AiWorkspaceScenario =
  | "normal"
  | "disabled"
  | "safe-mode"
  | "installed-disabled"
  | "installed-copy"
  | "initializing"
  | "unavailable";
export function createAiWorkspaceFixture(
  kind: AiPanelKind,
  layout: AiPanelLayout,
  scenario: AiWorkspaceScenario,
) {
  let releaseModels!: () => void;
  const modelReady = new Promise<void>((resolve) => {
    releaseModels = resolve;
  });
  if (scenario !== "initializing") releaseModels();
  const seed: Record<string, string> = { ...files };
  if (scenario === "disabled")
    seed[".lapis/core-plugins.json"] = JSON.stringify({
      disabled: ["ai"],
      enabled: [],
    });
  if (scenario === "installed-disabled" || scenario === "installed-copy") {
    seed[".lapis/installed-plugins.json"] = JSON.stringify({
      schemaVersion: 1,
      updatedAt: "2026-10-17T00:00:00Z",
      plugins: {
        ai: { pluginId: "ai", enabled: scenario !== "installed-disabled" },
      },
    });
    seed[".lapis/community-plugins.json"] = '["ai"]';
    seed[".lapis/plugins/ai/manifest.json"] = JSON.stringify({
      id: "ai",
      name: "Old installed AI",
      version: "0.1.0",
      main: "main.js",
    });
    seed[".lapis/plugins/ai/main.js"] =
      'throw new Error("Old AI must never activate");';
    seed[".lapis/plugins/ai/data.json"] = JSON.stringify({
      settings: { defaultRuntime: "acp", thinking: "high" },
      retainedExtra: true,
    });
  }
  const safeMode =
    scenario === "safe-mode"
      ? { ...normalRecovery(), active: true, disableOptionalCorePlugins: true }
      : normalRecovery();
  const database = new MemoryAppDatabase(crypto.randomUUID());
  const app = new App({
    version: "0.1.0-catalog",
    configPath: ".lapis/app.json",
    adapter: new MemoryVaultAdapter(seed),
    appDatabase: database,
    safeMode,
    markdownRenderer: async () => {},
    workspaceShell: { application: { name: "Lapis Notes" } },
  });
  const compatibility = installApplicationCompatibility(app);
  const runtimes: FakeAgentRuntime[] = [];
  let clients = 0;
  let released = 0;
  let modelRequests = 0;
  const unbind = bindAi(app, () => {
    clients += 1;
    const runtime = new FakeAgentRuntime({ id: "acp", resumeSupported: false });
    runtimes.push(runtime);
    let closed = false;
    return {
      runtime,
      models: {
        listModels: async (provider) => {
          modelRequests++;
          await modelReady;
          return [{ provider, model: "fixture-model", isDefault: true }];
        },
      },
      unavailableReason: () =>
        scenario === "unavailable" ? "Fixture native AI is unavailable" : null,
      close: async () => {
        if (closed) return;
        closed = true;
        released += 1;
        for (const session of runtime.sessions) await session.close();
      },
    };
  });
  function plugin() {
    const value = app.plugins.plugins.get("ai");
    return value instanceof AiPlugin ? value : undefined;
  }
  const ready = (async () => {
    await app.vault.load();
    await app.configuration.load();
    await seedConversations(
      new ConversationRepository(new VaultTranscriptStore(app.vault)),
    );
    app.plugins.registerStaticPlugins([
      {
        plugin: SourceEditorPlugin,
        styles: sourceEditorStyles,
        required: false,
        enabledByDefault: true,
      },
      {
        plugin: MarkdownPlugin,
        styles: markdownStyles,
        required: false,
        enabledByDefault: true,
      },
      { plugin: SearchFixturePlugin, required: false, enabledByDefault: true },
      {
        plugin: AiPlugin,
        required: false,
        enabledByDefault: await aiEnabledByDefault(app),
        distribution: "bundled",
      },
    ]);
    await app.plugins.loadPlugins({
      ...pluginLoadOptions(safeMode),
      communityPlugins: "disabled",
    });
    const ai = plugin();
    if (ai?.loaded) await ai.application.conversationIndex.rebuild();
    await app.workspace.changeLayout(aiPanelLayout(kind, layout));
    let note: import("@lapis-notes/api").WorkspaceLeaf | undefined;
    app.workspace.iterateRootLeaves((leaf) => {
      if (leaf.view.getViewType() === "markdown") note = leaf;
    });
    if (note) app.workspace.setActiveLeaf(note, { focus: false });
  })();
  let shutdown: Promise<void> | undefined;
  const close = () =>
    (shutdown ??= (async () => {
      releaseModels();
      try {
        await ready;
      } finally {
        await app.fileEditingSessions.settleOperations();
        for (const owner of [...app.plugins.plugins.values()].reverse())
          await owner.disable();
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
    plugin,
    releaseModels,
    async inspect() {
      const ai = plugin();
      if (ai?.loaded) await ai.settings.settle();
      const controller = getWorkspaceHostBinding(app.workspace).controller;
      return JSON.stringify({
        clients,
        released,
        modelRequests,
        loaded: ai?.loaded ?? false,
        settings: ai?.getSettings(),
        data: await ai?.loadData(),
        sessions: runtimes.flatMap((runtime) =>
          runtime.sessions.map((session) => ({
            id: session.id,
            closed: session.closed,
            prompts: session.prompts,
          })),
        ),
        notices: controller.notifications.transient
          .filter((item) => item.source === "ai")
          .map((item) => item.message),
        panelCount: app.workspace.getLeavesOfType(AI_PANEL_TYPES[kind]).length,
        activeFile: app.workspace.getActiveFile()?.path,
      });
    },
    close: async () => {
      unregister();
      await close();
    },
  };
}

type AiWorkspaceFixture = ReturnType<typeof createAiWorkspaceFixture>;
const fixtures = new WeakMap<HTMLElement, AiWorkspaceFixture>();
export function registerAiWorkspaceFixture(
  root: HTMLElement,
  fixture: AiWorkspaceFixture,
): () => void {
  fixtures.set(root, fixture);
  return () => {
    if (fixtures.get(root) === fixture) fixtures.delete(root);
  };
}
export function aiWorkspaceFixture(element: HTMLElement): AiWorkspaceFixture {
  const root = element.querySelector<HTMLElement>(
    '[data-testid="ai-workspace-demo"]',
  );
  const fixture = root && fixtures.get(root);
  if (!fixture)
    throw new Error("The owned AI workspace fixture is unavailable");
  return fixture;
}
