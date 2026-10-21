<script lang="ts">
  import { registerAiReview } from "./review.ts";
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
  let root = $state<HTMLDivElement>();
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
  $effect(() => {
    if (!root) return;
    return registerAiReview(root, {
      read: (name) => {
        const values: Record<string, string> = {
          "Saved AI data": persisted,
          "Flat app settings": flat,
          "Model catalog requests": calls,
          "AI notifications": notifications,
          "AI model source registered": String(registered),
          "Compute commands": JSON.stringify(
            fixture.plugin.setup?.commands ?? [],
          ),
        };
        return values[name] ?? "";
      },
      actions: {
        "Inspect saved settings": inspect,
        "Verify retired conversation tabs": async () => {
          const { checkRetiredTabs } = await import("./retired-tabs-checks.ts");
          await checkRetiredTabs(fixture);
        },
        "Fail next settings write": () => {
          fixture.plugin.failNextSave = true;
        },
        "Register temporary tool": () => {
          extra ??= fixture.plugin.registerTool("temporary_tool", "community");
        },
        "Unregister temporary tool": () => {
          extra?.dispose();
          extra = undefined;
        },
        "Disable AI settings": async () => {
          await fixture.plugin.disable();
          await inspect();
        },
      },
    });
  });
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

<div
  bind:this={root}
  data-ai-review
  class="settings-demo"
  data-settings-ready={ready}
>
  {#if ready}<WorkspaceSettingsSurface
      controller={controller.settings}
      app={controller}
    />{/if}
  {#if failure}<p role="alert">{failure}</p>{/if}
</div>

<style>
  .settings-demo {
    height: 100vh;
    overflow: auto;
  }
</style>
