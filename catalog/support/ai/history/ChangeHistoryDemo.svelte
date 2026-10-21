<script lang="ts">
  import { onMount, tick, untrack } from "svelte";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { createSentContextFixture } from "../sent-context/fixture.ts";
  import { memoryHistory } from "./memory-history.ts";
  import { bindAiHistory } from "../../../../src/lib/repository/ai-history.ts";
  import { registerAiReview } from "../review.ts";
  import { installHistoryNavigation } from "./navigation.ts";
  let {
    failure = false,
    unknown = false,
    navigation = true,
  }: { failure?: boolean; unknown?: boolean; navigation?: boolean } = $props();
  const fixture = untrack(() => createSentContextFixture(unknown));
  const history = untrack(() => memoryHistory(failure));
  const release = bindAiHistory(fixture.app, history.binding);
  const initialized = fixture.ready.then(() =>
    navigation ? installHistoryNavigation(fixture.app) : undefined,
  );
  let ready = $state(false),
    root = $state<HTMLDivElement>();
  $effect(() =>
    root
      ? registerAiReview(root, {
          read: (name) => {
            if (name === "undone") return history.inspect();
            if (name === "active-view")
              return fixture.app.workspace.activeLeaf?.view.getViewType() ?? "";
            if (name.startsWith("leaves:"))
              return String(
                fixture.app.workspace.getLeavesOfType(name.slice(7)).length,
              );
            return fixture.inspect(name);
          },
          actions: {
            ready: async () => {
              await initialized;
              await tick();
            },
            "return-chat": async () => {
              const leaf =
                fixture.app.workspace.getLeavesOfType("ai-sent-context")[0]!;
              fixture.app.workspace.activateLeaf(leaf, {
                focusRootHost: false,
              });
              await fixture.app.workspace.revealLeaf(leaf);
            },
          },
        })
      : undefined,
  );
  onMount(() => {
    let closed = false;
    void initialized.then(() => {
      if (!closed) ready = true;
    });
    return () => {
      closed = true;
      release();
      void initialized.then(
        () => fixture.close(),
        () => fixture.close(),
      );
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
