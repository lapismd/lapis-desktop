<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import {
    createNativeRouteFixture,
    type NativeRouteScenario,
  } from "./route-fixture.ts";
  let { scenario = "restored" }: { scenario?: NativeRouteScenario } = $props();
  const fixture = untrack(() => createNativeRouteFixture(scenario));
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

<div class="native-route-review">
  {#if ready}<WorkspaceShell
      app={fixture.app}
      workspaceLabel="Lapis Notes"
    />{/if}
</div>

<style>
  .native-route-review {
    height: 100vh;
    width: 100%;
    display: flex;
    min-height: 0;
    overflow: hidden;
  }
  .native-route-review :global([data-ui-component="lapis-workspace-shell"]) {
    height: 100%;
    width: 100%;
    min-height: 0;
  }
  :global(body:has(.native-route-review) #storybook-root) {
    height: 100vh;
    padding: 0;
    overflow: hidden;
  }
</style>
