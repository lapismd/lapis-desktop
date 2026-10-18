<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { registerAiReview } from "../review.ts";
  import {
    createTranscriptFixture,
    type TranscriptScenario,
  } from "./fixture.ts";
  let { scenario = "conversation" }: { scenario?: TranscriptScenario } =
    $props();
  const fixture = untrack(() => createTranscriptFixture(scenario));
  let ready = $state(false);
  let root = $state<HTMLDivElement>();
  $effect(() => {
    if (root) return registerAiReview(root, { read: fixture.inspect });
  });
  onMount(() => {
    let disposed = false;
    void fixture.ready
      .then(() => {
        if (!disposed) ready = true;
      })
      .catch(console.error);
    return () => {
      disposed = true;
      void fixture.close().catch(console.error);
    };
  });
</script>

<div
  bind:this={root}
  data-ai-review
  class="transcript-review"
  data-testid="transcript-review"
  data-ready={ready}
>
  {#if ready}<WorkspaceShell
      app={fixture.app}
      workspaceLabel="Lapis Notes"
    />{/if}
</div>

<style>
  .transcript-review {
    height: 100vh;
    width: 100%;
    display: flex;
    min-height: 0;
    overflow: hidden;
  }
  .transcript-review :global([data-ui-component="lapis-workspace-shell"]) {
    height: 100%;
    width: 100%;
    min-height: 0;
  }
  :global(body:has(.transcript-review) #storybook-root) {
    height: 100vh;
    padding: 0;
    overflow: hidden;
  }
</style>
