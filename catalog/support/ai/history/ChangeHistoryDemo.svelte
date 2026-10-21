<script lang="ts">
  import { onMount, tick, untrack } from "svelte";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { createSentContextFixture } from "../sent-context/fixture.ts";
  import { memoryHistory } from "./memory-history.ts";
  import { bindAiHistory } from "../../../../src/lib/repository/ai-history.ts";
  import { registerAiReview } from "../review.ts";
  let {
    failure = false,
    unknown = false,
  }: { failure?: boolean; unknown?: boolean } = $props();
  const fixture = untrack(() => createSentContextFixture(unknown));
  const history = untrack(() => memoryHistory(failure));
  const release = bindAiHistory(fixture.app, history.binding);
  let ready = $state(false),
    root = $state<HTMLDivElement>();
  $effect(() =>
    root
      ? registerAiReview(root, {
          read: (name) =>
            name === "undone" ? history.inspect() : fixture.inspect(name),
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
    let closed = false;
    void fixture.ready.then(() => {
      if (!closed) ready = true;
    });
    return () => {
      closed = true;
      release();
      void fixture.close();
    };
  });
</script>

<div class="history-demo" bind:this={root} data-ai-review>
  {#if ready}<WorkspaceShell
      app={fixture.app}
      workspaceLabel="Lapis Notes"
    />{/if}
</div>

<style>
  .history-demo {
    display: flex;
    width: 100%;
    height: 100vh;
    min-height: 0;
    overflow: hidden;
  }
  .history-demo :global([data-ui-component="lapis-workspace-shell"]) {
    width: 100%;
    height: 100%;
  }
  :global(body:has(.history-demo) #storybook-root) {
    padding: 0;
    height: 100vh;
  }
</style>
