<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import {
    createCaptureFixture,
    type CaptureScenario,
  } from "./capture-fixture.ts";
  let { scenario = "ready" }: { scenario?: CaptureScenario } = $props();
  const fixture = untrack(() => createCaptureFixture(scenario));
  let ready = $state(false);
  onMount(() => {
    let active = true;
    void fixture.ready
      .then(() => {
        if (active) ready = true;
      })
      .catch(console.error);
    return () => {
      active = false;
      void fixture.close().catch(console.error);
    };
  });
</script>

<div class="capture-layout-review">
  {#if ready}<WorkspaceShell
      app={fixture.app}
      workspaceLabel="Lapis Notes"
    />{/if}
</div>

<style>
  .capture-layout-review {
    height: 100vh;
    display: flex;
    width: 100%;
    min-height: 0;
    overflow: hidden;
  }
  .capture-layout-review :global([data-ui-component="lapis-workspace-shell"]) {
    height: 100%;
    width: 100%;
    min-height: 0;
  }
  :global(body:has(.capture-layout-review) #storybook-root) {
    height: 100vh;
    padding: 0;
    overflow: hidden;
  }
</style>
