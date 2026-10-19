<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { createImportFixture, type ImportScenario } from "./fixture.ts";
  let { scenario = "ready" }: { scenario?: ImportScenario } = $props();
  const fixture = untrack(() => createImportFixture(scenario));
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

<div class="import-review">
  {#if ready}<WorkspaceShell
      app={fixture.app}
      workspaceLabel="Lapis Notes"
    />{/if}
</div>

<style>
  .import-review {
    height: 100vh;
    display: flex;
    width: 100%;
    min-height: 0;
    overflow: hidden;
  }
  .import-review :global([data-ui-component="lapis-workspace-shell"]) {
    height: 100%;
    width: 100%;
    min-height: 0;
  }
  :global(body:has(.import-review) #storybook-root) {
    height: 100vh;
    padding: 0;
    overflow: hidden;
  }
</style>
