<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { createNativeReaderFixture } from "./fixture.ts";
  import type { NativeReaderScenario } from "./port.ts";
  let { scenario = "captured" }: { scenario?: NativeReaderScenario } = $props();
  const fixture = untrack(() => createNativeReaderFixture(scenario));
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

<div class="native-reader-review">
  {#if ready}<WorkspaceShell
      app={fixture.app}
      workspaceLabel="Lapis Notes"
    />{/if}
</div>

<style>
  .native-reader-review {
    height: 100vh;
    width: 100%;
    display: flex;
    min-height: 0;
    overflow: hidden;
  }
  .native-reader-review :global([data-ui-component="lapis-workspace-shell"]) {
    height: 100%;
    width: 100%;
    min-height: 0;
  }
  :global(body:has(.native-reader-review) #storybook-root) {
    height: 100vh;
    padding: 0;
    overflow: hidden;
  }
</style>
