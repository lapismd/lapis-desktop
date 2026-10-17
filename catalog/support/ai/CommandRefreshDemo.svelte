<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { createCommandRefreshFixture } from "./command-refresh.ts";
  const fixture = untrack(createCommandRefreshFixture);
  let ready = $state(false);
  let failure = $state("");
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

<div class="command-review" data-command-review-ready={ready}>
  <div class="command-review__shell">
    {#if ready}<WorkspaceShell app={fixture.app} />{/if}
  </div>
  {#if failure}<p role="alert">{failure}</p>{/if}
  <div role="group" aria-label="External command fixture controls">
    <button onclick={() => fixture.add()}>Add external command</button>
    <button onclick={() => fixture.edit()}>Edit external command</button>
    <button onclick={() => fixture.remove()}>Delete external command</button>
    <button onclick={fixture.fail}>Make commands unreadable</button>
    <button onclick={fixture.recover}>Make commands readable</button>
  </div>
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
