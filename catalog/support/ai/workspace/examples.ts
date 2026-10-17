// SPDX-License-Identifier: Apache-2.0
import { expect } from "storybook/test";
import {
  aiPanelLayout,
  aiPanelMarker,
  type AiPanelKind,
  type AiPanelLayout,
} from "./layout.ts";
export const AI_PLACEMENTS = {
  "middle-top-tabs": "Middle (Top Tabs)",
  "stacked-tabs": "Stacked Tabs",
  "left-sidebar": "Left Sidebar",
  "right-sidebar": "Right Sidebar",
  "bottom-panel": "Bottom Panel",
  "sidebar-group": "Sidebar As a Group",
};
export function aiPlacementParameters(
  kind: AiPanelKind,
  layout: AiPanelLayout,
) {
  const persisted = JSON.stringify(aiPanelLayout(kind, layout), null, 2);
  return {
    layout: "fullscreen",
    docs: {
      canvas: { className: "ai-workspace-docs-canvas" },
      story: { height: "700px", inline: false },
      description: {
        story: `${AI_PLACEMENTS[layout]} uses the real desktop AI plugin and persisted workspace layout.`,
      },
      source: {
        language: "ts",
        type: "code",
        code: `import { mount, unmount } from "svelte";
import { App, MemoryAppDatabase, MemoryVaultAdapter, installApplicationCompatibility } from "@lapis-notes/api";
import { WorkspaceShell } from "@lapis-notes/workspace";
import { MarkdownPlugin } from "@lapis-notes/markdown";
import { SourceEditorPlugin } from "@lapis-notes/source-editor";
import markdownStyles from "@lapis-notes/markdown/styles.css?inline";
import editorStyles from "@lapis-notes/source-editor/styles.css?inline";
import { AiPlugin } from "./src/components/ai/plugin/ai-plugin.ts";
import { bindAi, type AiFactory } from "./src/lib/ai/plugin/services.ts";

// Supply the desktop's admitted service factory; stories inject test clients.
export async function openAiPanel(target: HTMLElement, createServices: AiFactory) {
  const database = new MemoryAppDatabase(crypto.randomUUID());
  const app = new App({ version: "0.1.0", configPath: ".lapis/app.json",
    adapter: new MemoryVaultAdapter({ "Notes/Welcome.md": "# Welcome" }),
    appDatabase: database, markdownRenderer: async () => {} });
  const release = bindAi(app, createServices);
  const compatibility = installApplicationCompatibility(app);
  await app.vault.load();
  await app.configuration.load();
  app.plugins.registerStaticPlugins([
    { plugin: SourceEditorPlugin, required: false, enabledByDefault: true, styles: editorStyles },
    { plugin: MarkdownPlugin, required: false, enabledByDefault: true, styles: markdownStyles },
    { plugin: AiPlugin, required: false, enabledByDefault: true, distribution: "bundled" },
  ]);
  await app.plugins.loadPlugins({ communityPlugins: "disabled" });
  const layout = ${persisted};
  await app.workspace.changeLayout(layout);
  const component = mount(WorkspaceShell, { target, props: { app } });
  return { app, component, async dispose() {
    await app.fileEditingSessions.settleOperations();
    for (const plugin of [...app.plugins.plugins.values()].reverse()) await plugin.disable();
    await unmount(component);
    await app.workspace.disposeWorkspaceHost();
    await app.fileEditingSessions.dispose();
    await app.metadataCache.dispose();
    await database.close();
    release(); compatibility();
  } };
}`,
      },
    },
  };
}
export function expectAiExample(
  parameters: {
    docs?: {
      canvas?: { className?: string };
      story?: { height?: string; inline?: boolean };
      source?: { language?: string; type?: string; code?: string };
    };
  },
  kind: AiPanelKind,
  layout: AiPanelLayout,
) {
  expect(parameters.docs?.canvas?.className).toBe("ai-workspace-docs-canvas");
  expect(parameters.docs?.story).toEqual({ height: "700px", inline: false });
  expect(parameters.docs?.source?.language).toBe("ts");
  expect(parameters.docs?.source?.type).toBe("code");
  const source = parameters.docs?.source?.code ?? "";
  expect(source).toContain(
    'import { WorkspaceShell } from "@lapis-notes/workspace";',
  );
  expect(source).toContain(
    'import { AiPlugin } from "./src/components/ai/plugin/ai-plugin.ts";',
  );
  expect(source).toContain("app.workspace.changeLayout(layout)");
  expect(source).toContain(`"${aiPanelMarker(kind, layout)}"`);
  expect(source).not.toContain("Demo");
  expect(source).not.toContain("args.");
}
