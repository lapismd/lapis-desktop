<script lang="ts">
  import { untrack } from "svelte";
  import NotesDemo from "../NotesDemo.svelte";
  import { terminalFixture, type TerminalScenario } from "./fixture";
  import { normalRecovery } from "../../../src/lib/notes/startup-recovery";
  import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
  import { TerminalPlugin } from "../../../src/components/terminal/terminal-plugin";
  import { reviewLayout } from "../desktop/layout";
  import { registerTerminalReview } from "./review";
  let { scenario = "normal" }: { scenario?: TerminalScenario } = $props();
  const fixture = untrack(() => terminalFixture(scenario));
  const files = untrack(() => {
    const value: Record<string, string> = {
      ".lapis/workspace.json": JSON.stringify(reviewLayout()),
    };
    if (scenario === "disabled")
      value[".lapis/core-plugins.json"] = JSON.stringify({
        disabled: ["terminal"],
        enabled: [],
      });
    if (scenario === "installed-disabled" || scenario === "installed-copy") {
      value[".lapis/installed-plugins.json"] = JSON.stringify({
        schemaVersion: 1,
        updatedAt: "2026-10-17T00:00:00Z",
        plugins: {
          terminal: {
            pluginId: "terminal",
            enabled: scenario !== "installed-disabled",
          },
        },
      });
      value[".lapis/community-plugins.json"] = '["terminal"]';
      value[".lapis/plugins/terminal/manifest.json"] = JSON.stringify({
        id: "terminal",
        name: "Old installed Terminal",
        version: "0.1.0",
        main: "main.js",
      });
      value[".lapis/plugins/terminal/main.js"] =
        'throw new Error("Old Terminal must never activate");';
      value[".lapis/plugins/terminal/data.json"] = JSON.stringify({
        shell: "/bin/sh",
        cwd: "notes",
        retainedExtra: true,
      });
    }
    return value;
  });
  const safeMode = untrack(() =>
    scenario === "safe-mode"
      ? { ...normalRecovery(), active: true, disableOptionalCorePlugins: true }
      : normalRecovery(),
  );
  let fixtureRoot = $state<HTMLDivElement>();
  let generation = 0;
  function plugin(): TerminalPlugin | undefined {
    return fixture.app?.plugins.corePlugins.find(
      (value) => value instanceof TerminalPlugin,
    ) as TerminalPlugin | undefined;
  }
  async function startRestored(): Promise<void> {
    const app = fixture.app;
    if (!app) return;
    const leaf = app.workspace.getBottomLeaf();
    await leaf.setViewState({
      type: "terminal",
      state: { sessionId: "an-older-process" },
    });
    await app.workspace.revealLeaf(leaf);
    app.workspace.setBottomPanelOpen(true);
  }

  $effect(() => {
    const root = fixtureRoot;
    if (!root) return;
    return registerTerminalReview(root, {
      fixture,
      restore: startRestored,
      async move() {
        const app = fixture.app;
        const leaf = app?.workspace.getLeavesOfType("terminal")[0];
        if (app && leaf)
          await app.workspace.dropWorkspaceItemOnTabs(app.workspace.rootSplit, {
            item: leaf,
            position: "right",
          });
      },
      async close() {
        const app = fixture.app;
        const leaf = app?.workspace.getLeavesOfType("terminal")[0];
        if (app && leaf)
          getWorkspaceHostBinding(app.workspace).controller.workspace.closeLeaf(
            leaf.id,
          );
      },
      async disable() {
        await plugin()?.disable();
      },
      async exit() {
        const [info] = await fixture.transport.list();
        if (info) fixture.transport.exit(info.id);
      },
      resize() {
        const panel = root.querySelector<HTMLElement>(".notes-demo");
        if (panel) panel.style.height = ++generation % 2 ? "520px" : "760px";
      },
      async inspect() {
        return {
          sessions: (await fixture.transport.list()).length,
          inputs: JSON.stringify(fixture.transport.inputs),
          dimensions: JSON.stringify(fixture.dimensions),
          scrolls: JSON.stringify(fixture.scrolls),
          preferences: JSON.stringify(plugin()?.getSettings() ?? {}),
          configuration: JSON.stringify(
            JSON.parse(
              (await fixture.app?.vault.adapter.read(".lapis/app.json")) ??
                "{}",
            ),
          ),
        };
      },
    });
  });
</script>

<div bind:this={fixtureRoot} data-terminal-scenario={scenario}>
  <NotesDemo createTerminal={fixture.factory} {files} {safeMode} />
</div>
