<script lang="ts">
  import { onMount, untrack } from "svelte";
  import AiHistoryPanel from "../../../src/components/ai/history/AiHistoryPanel.svelte";
  import AiCatalogPanel from "../../../src/components/ai/catalog/AiCatalogPanel.svelte";
  import { createPanelFixture } from "./panel-fixture.ts";
  let { kind = "history" }: { kind?: "history" | "catalog" } = $props();
  const fixture = untrack(createPanelFixture);
  let ready = $state(false);
  let mounted = $state(true);
  let failure = $state("");
  let inspection = $state("");
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

<div class="panel-demo" data-panels-ready={ready}>
  <div class="panel-demo__panel">
    {#if ready && mounted}
      {#if kind === "history"}<AiHistoryPanel {...fixture.history} />
      {:else}<AiCatalogPanel {...fixture.catalog} />{/if}
    {/if}
  </div>
  {#if failure}<p role="alert">{failure}</p>{/if}
  <div role="group" aria-label="Panel fixture controls">
    <button onclick={() => (inspection = fixture.inspect())}
      >Inspect panel state</button
    >
    <button onclick={fixture.failNextAction}>Fail next panel action</button>
    <button onclick={fixture.failNextLoad}>Fail next catalog load</button>
    <button onclick={fixture.holdNext}>Hold next panel refresh</button>
    <button onclick={fixture.release}>Release held panel refresh</button>
    <button onclick={() => fixture.registerTool(`temporary_${++extra}`)}
      >Register temporary tool</button
    >
    <button onclick={() => (mounted = false)}>Unmount panel</button>
  </div>
  <output aria-label="Panel fixture state">{inspection}</output>
</div>

<style>
  .panel-demo {
    height: 700px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .panel-demo__panel {
    flex: 1;
    min-height: 0;
  }
  output {
    overflow-wrap: anywhere;
  }
</style>
