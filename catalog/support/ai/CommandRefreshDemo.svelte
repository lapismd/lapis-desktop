<script lang="ts">
  import { registerAiReview } from "./review.ts";
  import { onMount, untrack } from "svelte";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { createCommandRefreshFixture } from "./command-refresh.ts";
  const fixture = untrack(createCommandRefreshFixture);
  let ready = $state(false);
  let failure = $state("");
  let root = $state<HTMLDivElement>();
  $effect(() => {
    if (root)
      return registerAiReview(root, {
        actions: {
          "Add external command": () => fixture.add(),
          "Edit external command": () => fixture.edit(),
          "Delete external command": () => fixture.remove(),
          "Make commands unreadable": fixture.fail,
          "Make commands readable": fixture.recover,
        },
      });
  });
  onMount(() => {
    let disposed = false;
    void fixture.ready.then(
      () => {
        if (!disposed) ready = true;
      },
      (error) => {
        if (!disposed) failure = String(error);
      },
    );
    return () => {
      disposed = true;
      void fixture.close().catch(console.error);
    };
  });
</script>

<div
  bind:this={root}
  data-ai-review
  class="command-review"
  data-command-review-ready={ready}
>
  <div class="command-review__shell">
    {#if ready}<WorkspaceShell app={fixture.app} />{/if}
  </div>
  {#if failure}<p role="alert">{failure}</p>{/if}
</div>

<style>
  .command-review {
    display: flex;
    flex-direction: column;
    height: 100vh;
    min-height: 0;
  }
  .command-review__shell {
    flex: 1;
    min-height: 0;
  }
</style>
