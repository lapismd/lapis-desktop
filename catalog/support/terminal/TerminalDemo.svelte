<script lang="ts">
  import { untrack } from "svelte";
  import NotesDemo from "../NotesDemo.svelte";
  import { terminalFixture, type TerminalScenario } from "./fixture";
  import { normalRecovery } from "../../../src/lib/notes/startup-recovery";
  import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
  import { TerminalPlugin } from "../../../src/components/terminal/terminal-plugin";
  let { scenario = "normal" }: { scenario?: TerminalScenario } = $props();
  const fixture = untrack(() => terminalFixture(scenario));
  const files = untrack(() => {
    const value: Record<string, string> = {};
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
  let fixtureRoot: HTMLDivElement;
  let active = $state(0);
  let sent = $state("");
  let dimensions = $state("");
  let scrolls = $state("");
  let preferences = $state("");
  let canonical = $state("");
  let generation = 0;
  async function status(): Promise<void> {
    active = (await fixture.transport.list()).length;
    sent = JSON.stringify(fixture.transport.inputs);
    dimensions = JSON.stringify(fixture.dimensions);
    scrolls = JSON.stringify(fixture.scrolls);
    preferences = JSON.stringify(plugin()?.getSettings());
    canonical = JSON.stringify(
      JSON.parse(
        (await fixture.app?.vault.adapter.read(".lapis/app.json")) ?? "{}",
      ),
    );
  }
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
</script>

<div bind:this={fixtureRoot} data-terminal-scenario={scenario}>
  <NotesDemo createTerminal={fixture.factory} {files} {safeMode} />
  <div
    class="fixture-controls"
    role="group"
    aria-label="Terminal fixture controls"
  >
    <button
      onclick={async () => {
        await fixture.app?.commands.executeCommand("terminal:new");
      }}>New terminal command</button
    >
    <button onclick={startRestored}>Restore old terminal tab</button>
    <button onclick={status}>Inspect native sessions</button>
    <output aria-label="Retained sessions">{active}</output>
    <output aria-label="Sent input">{sent}</output>
    <output aria-label="Terminal dimensions">{dimensions}</output>
    <output aria-label="Scroll deltas">{scrolls}</output>
    <output aria-label="Terminal preferences">{preferences}</output>
    <output aria-label="Canonical configuration">{canonical}</output>
    <button
      onclick={async () => {
        const app = fixture.app;
        const leaf = app?.workspace.getLeavesOfType("terminal")[0];
        if (leaf)
          await app?.workspace.dropWorkspaceItemOnTabs(
            app.workspace.rootSplit,
            { item: leaf, position: "right" },
          );
      }}>Move terminal to main pane</button
    >
    <button
      onclick={async () => {
        const app = fixture.app;
        const leaf = app?.workspace.getLeavesOfType("terminal")[0];
        if (app && leaf)
          getWorkspaceHostBinding(app.workspace).controller.workspace.closeLeaf(
            leaf.id,
          );
        await status();
      }}>Close terminal tab</button
    >
    <button
      onclick={async () => {
        await plugin()?.disable();
        await status();
      }}>Disable Terminal</button
    >
    <button
      onclick={async () => {
        const [info] = await fixture.transport.list();
        if (info) fixture.transport.exit(info.id);
      }}>Exit shell</button
    >
    <button
      onclick={async () => {
        const panel = fixtureRoot.querySelector<HTMLElement>(".notes-demo");
        if (panel) panel.style.height = ++generation % 2 ? "520px" : "760px";
      }}>Resize workspace</button
    >
  </div>
</div>

<style>
  .fixture-controls {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.5rem;
  }
</style>
