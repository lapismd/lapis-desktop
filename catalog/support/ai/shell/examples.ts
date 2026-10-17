// SPDX-License-Identifier: Apache-2.0
import type { WorkspaceRequestedDisplayMode } from "@lapismd/design-core/workspace/core";
import { shellSeed } from "./seed.ts";
import type { ShellScenario } from "./types.ts";
export function shellParameters(
  scenario: ShellScenario,
  displayMode: WorkspaceRequestedDisplayMode,
) {
  const community =
    scenario === "community-tools"
      ? `const community = app.agentTools.register(
    { pluginId: "story-community", source: "community", provenance: "community" },
    { name: "story_word_count", description: "Count words in a scoped note.", effect: "read",
      inputSchema: { type: "object" }, outputSchema: { type: "object" },
      execute: async () => ({ content: [{ type: "text", text: "42 words" }], structuredContent: { words: 42 } }) });`
      : "";
  const bind =
    scenario === "initializing"
      ? `let releaseModels!: () => void;
  const modelsReady = new Promise<void>(resolve => { releaseModels = resolve; });
  const release = bindAi(app, (ownedApp, tools) => {
    const services = createServices(ownedApp, tools);
    return { runtime: services.runtime, workspace: services.workspace,
      userAgents: services.userAgents, appToolBridge: services.appToolBridge,
      models: { listModels: async (provider, runtime) => {
        await modelsReady; return services.models.listModels(provider, runtime);
      } },
      unavailableReason: () => services.unavailableReason(),
      close: mode => services.close(mode) };
  });`
      : "const release = bindAi(app, createServices);";
  const scoped =
    scenario === "local-conversations" || scenario === "follow-scope";
  const scope = scoped
    ? `const activeNote = app.vault.getFileByPath(${JSON.stringify(scenario === "follow-scope" ? "Projects/work.md" : "Notes/Welcome.md")});
  const aiLeaf = app.workspace.getLeavesOfType("ai")[0];
  if (!activeNote || !aiLeaf) throw new Error("Missing initial conversation scope");
  const noteLeaf = app.workspace.getLeaf("tab");
  await noteLeaf.openFile(activeNote);
  app.workspace.activateLeaf(noteLeaf, { saveLayout: false });
  app.workspace.getActiveFile();
  const ai = app.plugins.plugins.get("ai");
  if (ai instanceof AiPlugin) ai.application.currentConversationScope();
  app.workspace.activateLeaf(aiLeaf, { saveLayout: false });
  ${scenario === "local-conversations" ? "noteLeaf.close();" : ""}`
    : "";
  return {
    layout: "fullscreen",
    docs: {
      canvas: { className: "ai-shell-docs-canvas" },
      story: { height: "700px", inline: false },
      description: {
        story: `Retained ${scenario} AI application flow through the real desktop plugin and public WorkspaceShell.`,
      },
      source: {
        language: "ts",
        type: "code",
        code: `import { mount, unmount } from "svelte";
import { App, MemoryAppDatabase, MemoryVaultAdapter, installApplicationCompatibility } from "@lapis-notes/api";
import { WorkspaceShell } from "@lapis-notes/workspace";
import { FileExplorerPlugin } from "@lapis-notes/file-explorer";
import { SourceEditorPlugin } from "@lapis-notes/source-editor";
import { MarkdownPlugin } from "@lapis-notes/markdown";
import { SearchPlugin } from "@lapis-notes/search";
import editorStyles from "@lapis-notes/source-editor/styles.css?inline";
import markdownStyles from "@lapis-notes/markdown/styles.css?inline";
import searchStyles from "@lapis-notes/search/styles.css?inline";
import { AiPlugin } from "./src/components/ai/plugin/ai-plugin.ts";
import { bindAi, type AiFactory } from "./src/lib/ai/plugin/services.ts";
import "@lapismd/design-core/styles.css";
import "@lapismd/design-core/themes/lapis.css";
import "@lapis-notes/ui/theme.css";

// The desktop supplies admitted services; catalog clients remain test-only.
export async function openAiShell(target: HTMLElement, createServices: AiFactory) {
  const previousHostStyle = target.style.cssText;
  Object.assign(target.style, { width: "100%", height: "100vh", minHeight: "0", overflow: "hidden" });
  const files = ${JSON.stringify(shellSeed(undefined, scenario), null, 2)};
  const database = new MemoryAppDatabase(crypto.randomUUID());
  const app = new App({ version: "0.1.0", configPath: ".lapis/app.json",
    adapter: new MemoryVaultAdapter(files), appDatabase: database,
    markdownRenderer: async () => {}, workspaceShell: { application: { name: "Lapis Notes" } } });
  ${bind}
  const compatibility = installApplicationCompatibility(app);
  ${community}
  await app.vault.load();
  await app.configuration.load();
  app.plugins.registerStaticPlugins([
    { plugin: SourceEditorPlugin, styles: editorStyles, required: false, enabledByDefault: true },
    { plugin: MarkdownPlugin, styles: markdownStyles, required: false, enabledByDefault: true, distribution: "bundled" },
    { plugin: FileExplorerPlugin, required: false, enabledByDefault: true, distribution: "bundled" },
    { plugin: SearchPlugin, styles: searchStyles, required: false, enabledByDefault: true, distribution: "bundled" },
    { plugin: AiPlugin, required: false, enabledByDefault: true, distribution: "bundled" },
  ]);
  await app.plugins.loadPlugins({ communityPlugins: "disabled", optionalCorePlugins: "configured" });
  const stopMetadata = app.metadataTypeManager.trackChanges();
  await app.metadataCache.load();
  const search = app.plugins.plugins.get("search");
  if (search instanceof SearchPlugin) await search.refreshIndex("ai-shell");
  await app.workspace.loadLayout();
  ${scope}
  const component = mount(WorkspaceShell, { target, props: { app, displayMode: ${JSON.stringify(displayMode)}, workspaceLabel: "Lapis Notes" } });
  return { app, ${scenario === "initializing" ? "releaseModels," : ""} async dispose() {
    ${scenario === "initializing" ? "releaseModels();" : ""}
    await app.fileEditingSessions.settleOperations();
    for (const plugin of [...app.plugins.plugins.values()].reverse()) await plugin.disable();
    ${scenario === "community-tools" ? "community.dispose();" : ""}
    stopMetadata();
    await unmount(component);
    await app.workspace.disposeWorkspaceHost();
    await app.fileEditingSessions.dispose();
    await app.metadataCache.dispose();
    await database.close();
    release(); compatibility();
    target.style.cssText = previousHostStyle;
  } };
}`,
      },
    },
  };
}
