<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import FileConflicts from "../../../src/components/files/FileConflicts.svelte";
  import {
    createConflictFixture,
    registerConflictFixture,
    type ConflictScenario,
  } from "./file-conflicts.ts";
  let {
    scenario = "modified",
    leaving = false,
  }: { scenario?: ConflictScenario; leaving?: boolean } = $props();
  const fixture = untrack(() => createConflictFixture(scenario));
  let root = $state<HTMLDivElement>();
  let ready = $state(false);
  let failure = $state("");
  $effect(() => {
    if (root) return registerConflictFixture(root, fixture);
  });
  onMount(() => {
    let disposed = false;
    void fixture.ready
      .then(() => {
        if (!disposed) ready = true;
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
  class="desktop-conflict-review"
  data-testid="desktop-conflict-review"
  data-ready={ready}
>
  {#if ready}
    <div class="shell" inert={leaving}>
      <WorkspaceShell app={fixture.app} displayMode="desktop" />
    </div>
    <FileConflicts
      app={fixture.app}
      registry={fixture.app.fileEditingSessions.textConflicts}
      disabled={leaving}
    />
  {/if}
  {#if failure}<p role="alert">{failure}</p>{/if}
</div>

<style>
  .desktop-conflict-review {
    display: flex;
    flex-direction: column;
    height: 100vh;
    min-height: 0;
    width: 100%;
    overflow: hidden;
  }
  .shell {
    flex: 1;
    min-height: 0;
  }
</style>
