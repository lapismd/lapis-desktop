<script lang="ts">
  import { onMount, tick, untrack } from "svelte";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { createSentContextFixture } from "./fixture.ts";
  import { registerAiReview } from "../review.ts";
  let { unknown = false }: { unknown?: boolean } = $props();
  const fixture = untrack(() => createSentContextFixture(unknown));
  let ready = $state(false);
  let root = $state<HTMLDivElement>();
  $effect(() =>
    root
      ? registerAiReview(root, {
          read: fixture.inspect,
          actions: {
            ready: async () => {
              await fixture.ready;
              await tick();
            },
          },
        })
      : undefined,
  );
  onMount(() => {
    let disposed = false;
    void fixture.ready.then(() => {
      if (!disposed) ready = true;
    });
    return () => {
      disposed = true;
      void fixture.close();
    };
  });
</script>

<div bind:this={root} class="sent-context-demo" data-ai-review>
  {#if ready}<WorkspaceShell
      app={fixture.app}
      workspaceLabel="Lapis Notes"
    />{/if}
</div>

<style>
  .sent-context-demo {
    display: flex;
    width: 100%;
    height: 100vh;
    min-height: 0;
    overflow: hidden;
  }
  .sent-context-demo :global([data-ui-component="lapis-workspace-shell"]) {
    width: 100%;
    height: 100%;
  }
  :global(body:has(.sent-context-demo) #storybook-root) {
    padding: 0;
    height: 100vh;
  }
</style>
