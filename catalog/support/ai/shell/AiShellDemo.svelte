<!-- SPDX-License-Identifier: Apache-2.0; retained App-backed AI shell. -->
<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import type { WorkspaceRequestedDisplayMode } from "@lapismd/design-core/workspace/core";
  import { createShellFixture, registerShellFixture } from "./fixture.ts";
  import type { ShellScenario } from "./types.ts";
  let {
    scenario = "default",
    displayMode = "desktop",
    reviewLayout = false,
    longMessages = false,
  }: {
    scenario?: ShellScenario;
    displayMode?: WorkspaceRequestedDisplayMode;
    reviewLayout?: boolean;
    longMessages?: boolean;
  } = $props();
  const fixture = untrack(() =>
    createShellFixture(scenario, reviewLayout, longMessages),
  );
  let root = $state<HTMLDivElement>();
  let status = $state("booting");
  let error = $state("");
  $effect(() => {
    if (root) return registerShellFixture(root, fixture);
  });
  onMount(() => {
    let disposed = false;
    void fixture.ready
      .then(() => {
        if (!disposed) status = "ready";
      })
      .catch((reason) => {
        if (!disposed) {
          status = "failed";
          error = String(reason);
        }
      });
    return () => {
      disposed = true;
      void fixture.close().catch(console.error);
    };
  });
</script>

<div
  bind:this={root}
  class="ai-shell-demo"
  data-testid="ai-shell-demo"
  data-status={status}
>
  {#if error}<p role="alert">{error}</p>{/if}
  {#if status === "ready"}<WorkspaceShell
      app={fixture.app}
      {displayMode}
      workspaceLabel="Lapis Notes"
    />{/if}
</div>

<style>
  .ai-shell-demo {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100vh;
    min-height: 0;
    overflow: hidden;
  }
  .ai-shell-demo :global([data-ui-component="lapis-workspace-shell"]) {
    flex: 1;
    width: 100%;
    height: 100%;
    min-height: 0;
  }
  :global(html:has(.ai-shell-demo)),
  :global(body:has(.ai-shell-demo)) {
    height: 100%;
    overflow: hidden;
  }
  :global(body:has(.ai-shell-demo) #storybook-root) {
    width: 100vw;
    height: 100vh;
    padding: 0;
    overflow: hidden;
  }
</style>
