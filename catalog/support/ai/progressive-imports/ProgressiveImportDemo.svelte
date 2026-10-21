<script lang="ts">
  import ImportReviewDemo from "../imports/ImportReviewDemo.svelte";
  import { onMount, untrack } from "svelte";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { registerCatalogCleanup } from "../../lifecycle.ts";
  import { progressiveImportFixture } from "./fixture.ts";
  import type { Scenario } from "./browser.svelte.ts";
  let {
    scenario = "browse",
    automatic = true,
  }: { scenario?: Scenario; automatic?: boolean } = $props();
  const fixture = untrack(() =>
    scenario === "streaming" && automatic
      ? undefined
      : progressiveImportFixture(scenario, automatic),
  );
  let ready = $state(false);
  const unregister = registerCatalogCleanup(
    () => fixture?.close() ?? Promise.resolve(),
  );
  onMount(() => {
    if (!fixture) return;
    let active = true;
    void fixture.ready.then(() => {
      if (active) ready = true;
    });
    return () => {
      active = false;
      unregister();
      void fixture.close();
    };
  });
</script>

{#if scenario === "streaming" && automatic}
  <ImportReviewDemo scenario="streaming" sessionLayout />
{:else}
  <div class="progressive-import-demo">
    {#if ready && fixture}<WorkspaceShell
        app={fixture.app}
        workspaceLabel="Lapis Notes"
      />{/if}
  </div>
{/if}

<style>
  .progressive-import-demo {
    display: flex;
    width: 100%;
    height: 100vh;
    min-height: 0;
    overflow: hidden;
  }
  .progressive-import-demo
    :global([data-ui-component="lapis-workspace-shell"]) {
    width: 100%;
    height: 100%;
  }
  :global(body:has(.progressive-import-demo) #storybook-root) {
    height: 100vh;
    padding: 0;
    overflow: hidden;
  }
</style>
