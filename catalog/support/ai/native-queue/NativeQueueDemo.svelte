<script lang="ts">
  import { untrack } from "svelte";
  import NotesDemo from "../../NotesDemo.svelte";
  import FixtureControls from "../../../FixtureControls.svelte";
  import { registerCatalogCleanup } from "../../lifecycle";
  import {
    nativeQueueFixture,
    registerNativeQueue,
    type QueueScenario,
  } from "./fixture";
  let { scenario = "running" }: { scenario?: QueueScenario } = $props();
  const fixture = untrack(() => nativeQueueFixture(scenario));
  const unregister = registerCatalogCleanup(async () =>
    fixture.releaseObservation(),
  );
  $effect(() => () => {
    fixture.releaseObservation();
    unregister();
  });
  let root: HTMLDivElement;
  $effect(() => {
    if (root) return registerNativeQueue(root, fixture);
  });
</script>

<div bind:this={root} data-native-queue-review>
  <NotesDemo nativeChat={fixture.create} />
  {#if scenario === "loading"}
    <FixtureControls label="Native queue fixture controls">
      <button type="button" onclick={fixture.releaseObservation}
        >Finish native observation</button
      >
    </FixtureControls>
  {/if}
</div>
