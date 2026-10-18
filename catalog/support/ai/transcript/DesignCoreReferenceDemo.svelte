<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import DesignCoreReference from "./DesignCoreReference.svelte";
  import { createReferenceFixture } from "./reference-fixture.ts";
  let {
    initialView = "document",
    showShell = true,
  }: { initialView?: "document" | "classic"; showShell?: boolean } = $props();
  const fixture = untrack(() =>
    showShell ? createReferenceFixture(initialView) : undefined,
  );
  let ready = $state(false);
  onMount(() => {
    let disposed = false;
    void fixture?.ready
      .then(() => {
        if (!disposed) ready = true;
      })
      .catch(console.error);
    return () => {
      disposed = true;
      void fixture?.close().catch(console.error);
    };
  });
</script>

{#if showShell}<div class="reference-shell">
    {#if ready && fixture}<WorkspaceShell
        app={fixture.app}
        workspaceLabel="Lapis Notes"
      />{/if}
  </div>{:else}<DesignCoreReference {initialView} />{/if}

<style>
  .reference-shell {
    height: 100vh;
    width: 100%;
    min-height: 0;
    display: flex;
    overflow: hidden;
  }
  .reference-shell :global([data-ui-component="lapis-workspace-shell"]) {
    height: 100%;
    width: 100%;
    min-height: 0;
  }
  :global(body:has(.reference-shell) #storybook-root) {
    height: 100vh;
    padding: 0;
    overflow: hidden;
  }
</style>
