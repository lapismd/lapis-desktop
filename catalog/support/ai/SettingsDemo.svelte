<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { WorkspaceSettingsSurface } from "@lapismd/design-core/workspace/settings";
  import {
    createSettingsFixture,
    type SettingsScenario,
  } from "./settings-fixture.ts";
  let { scenario = "normal" }: { scenario?: SettingsScenario } = $props();
  const fixture = untrack(() => createSettingsFixture(scenario));
  const controller = fixture.controller;
  let ready = $state(false);
  let failure = $state("");
  let persisted = $state("");
  let flat = $state("");
  let calls = $state("");
  let notifications = $state("");
  let registered = $state(true);
  let extra: { dispose(): void } | undefined;
  async function inspect() {
    await fixture.plugin.settings.settle();
    persisted = JSON.stringify(await fixture.plugin.loadData());
    flat = JSON.stringify(
      Object.fromEntries(
        fixture.app.configuration.getConfiguration().entries(),
      ),
    );
    calls = fixture.plugin.calls.join(",");
    notifications = fixture.controller.notifications.transient
      .filter((record) => record.source === "ai")
      .map((record) => record.message)
      .join("\n");
    registered = Boolean(
      controller.configuration.optionSources.resolve("ai.models.codex"),
    );
  }
  onMount(() => {
    let disposed = false;
    void fixture.ready
      .then(async () => {
        if (!disposed) {
          ready = true;
          await inspect();
        }
      })
      .catch((error) => {
        failure = String(error);
      });
    return () => {
      disposed = true;
      void fixture.close().catch(console.error);
    };
  });
</script>

<div class="settings-demo" data-settings-ready={ready}>
  {#if ready}<WorkspaceSettingsSurface
      controller={controller.settings}
      app={controller}
    />{/if}
  {#if failure}<p role="alert">{failure}</p>{/if}
  <div role="group" aria-label="Settings fixture controls">
    <button onclick={inspect}>Inspect saved settings</button>
    <button
      onclick={() => {
        fixture.plugin.failNextSave = true;
      }}>Fail next settings write</button
    >
    <button
      onclick={() => {
        extra ??= fixture.plugin.registerTool("temporary_tool", "community");
      }}>Register temporary tool</button
    >
    <button
      onclick={() => {
        extra?.dispose();
        extra = undefined;
      }}>Unregister temporary tool</button
    >
    <button
      onclick={async () => {
        await fixture.plugin.disable();
        await inspect();
      }}>Disable AI settings</button
    >
    <output aria-label="Saved AI data">{persisted}</output>
    <output aria-label="Flat app settings">{flat}</output>
    <output aria-label="Model catalog requests">{calls}</output>
    <output aria-label="AI notifications">{notifications}</output>
    <output aria-label="AI model source registered">{String(registered)}</output
    >
  </div>
</div>

<style>
  .settings-demo {
    height: 100vh;
    overflow: auto;
  }
</style>
