<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import {
    createAiWorkspaceFixture,
    registerAiWorkspaceFixture,
    type AiWorkspaceScenario,
  } from "./fixture.ts";
  import type { AiPanelKind, AiPanelLayout } from "./layout.ts";
  let {
    kind = "ai-history",
    layout = "right-sidebar",
    scenario = "normal",
    controls = false,
  }: {
    kind?: AiPanelKind;
    layout?: AiPanelLayout;
    scenario?: AiWorkspaceScenario;
    controls?: boolean;
  } = $props();
  const fixture = untrack(() =>
    createAiWorkspaceFixture(kind, layout, scenario),
  );
  let root = $state<HTMLDivElement>();
  $effect(() => {
    if (root) return registerAiWorkspaceFixture(root, fixture);
  });
  let status = $state("booting");
  let failure = $state("");
  let inspection = $state("");
  onMount(() => {
    let disposed = false;
    void fixture.ready
      .then(() => {
        if (!disposed) status = "ready";
      })
      .catch((error) => {
        failure = String(error);
        status = "failed";
      });
    return () => {
      disposed = true;
      void fixture.close().catch(console.error);
    };
  });
</script>

<div
  bind:this={root}
  class="ai-workspace-demo"
  data-testid="ai-workspace-demo"
  data-status={status}
>
  <div class="ai-workspace-demo__shell">
    {#if status === "ready"}
      <WorkspaceShell app={fixture.app} />
    {/if}
  </div>
  {#if failure}<p role="alert">{failure}</p>{/if}
  {#if controls}
    <div role="group" aria-label="AI workspace fixture controls">
      <button onclick={async () => (inspection = await fixture.inspect())}
        >Inspect AI ownership</button
      >
      <button
        onclick={async () => {
          await fixture.app.plugins.disablePlugin("ai");
        }}>Disable AI</button
      >
      <button
        onclick={async () => {
          await fixture.app.plugins.enablePlugin("ai");
        }}>Enable AI</button
      >
      <button
        onclick={async () => {
          await fixture.app.commands.executeCommand("ai:open-chat");
        }}>Open Chat command</button
      >
      <button
        onclick={async () => {
          await fixture.app.commands.executeCommand("ai:open-history");
        }}>Open History command</button
      >
      <button
        onclick={async () => {
          await fixture.app.commands.executeCommand("ai:open-catalog");
        }}>Open Catalog command</button
      >
    </div>
    <output aria-label="AI ownership state">{inspection}</output>
  {/if}
</div>

<style>
  .ai-workspace-demo {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100vh;
    min-height: 0;
    overflow: hidden;
  }
  .ai-workspace-demo__shell {
    flex: 1;
    min-height: 0;
  }
  .ai-workspace-demo__shell
    :global([data-ui-component="lapis-workspace-shell"]) {
    width: 100%;
    height: 100%;
    min-height: 0;
  }
  output {
    overflow-wrap: anywhere;
  }
  :global(html:has(.ai-workspace-demo)),
  :global(body:has(.ai-workspace-demo)) {
    height: 100%;
    overflow: hidden;
  }
  :global(body:has(.ai-workspace-demo) #storybook-root) {
    width: 100vw;
    height: 100vh;
    padding: 0;
    overflow: hidden;
  }
</style>
