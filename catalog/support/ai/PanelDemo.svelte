<script lang="ts">
  import { onMount, untrack } from "svelte";
  import AiHistoryPanel from "../../../src/components/ai/history/AiHistoryPanel.svelte";
  import AiCatalogPanel from "../../../src/components/ai/catalog/AiCatalogPanel.svelte";
  import { registerAiReview } from "./review.ts";
  import { createPanelFixture } from "./panel-fixture.ts";
  let { kind = "history" }: { kind?: "history" | "catalog" } = $props();
  const fixture = untrack(createPanelFixture);
  let ready = $state(false);
  let mounted = $state(true);
  let failure = $state("");
  let root = $state<HTMLDivElement>();
  $effect(() => {
    if (!root) return;
    return registerAiReview(root, {
      read: () => fixture.inspect(),
      actions: {
        "Fail next panel action": fixture.failNextAction,
        "Fail next catalog load": fixture.failNextLoad,
        "Hold next panel refresh": fixture.holdNext,
        "Release held panel refresh": fixture.release,
        "Register temporary tool": () =>
          fixture.registerTool(`temporary_${++extra}`),
        "Unmount panel": () => {
          mounted = false;
        },
      },
    });
  });
  let extra = 0;
  onMount(() => {
    let disposed = false;
    void fixture.ready
      .then(() => {
        if (!disposed) ready = true;
      })
      .catch((cause) => {
        failure = String(cause);
      });
    return () => {
      disposed = true;
      void fixture.close().catch(console.error);
    };
  });
</script>

<div
  bind:this={root}
  data-ai-review
  class="panel-demo"
  data-panels-ready={ready}
>
  <div class="panel-demo__panel">
    {#if ready && mounted}
      {#if kind === "history"}<AiHistoryPanel {...fixture.history} />
      {:else}<AiCatalogPanel {...fixture.catalog} />{/if}
    {/if}
  </div>
  {#if failure}<p role="alert">{failure}</p>{/if}
</div>

<style>
  .panel-demo {
    height: 100vh;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .panel-demo__panel {
    flex: 1;
    min-height: 0;
  }
</style>
