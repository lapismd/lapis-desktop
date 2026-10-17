<script lang="ts">
  import { untrack } from "svelte";
  import NotesDemo from "../NotesDemo.svelte";
  import { historyFixture } from "./fixture.ts";
  import { bindHistoryFixture } from "./context.ts";
  import { normalRecovery } from "../../../src/lib/notes/startup-recovery.ts";
  let { scenario = "ready" }: { scenario?: string } = $props();
  const fixture = untrack(() => historyFixture(scenario));
  const safeMode = untrack(() =>
    scenario === "safe-mode"
      ? { ...normalRecovery(), active: true, disableOptionalCorePlugins: true }
      : normalRecovery(),
  );
  let root: HTMLDivElement;
</script>

<div bind:this={root} data-repository-fixture class="repository-demo">
  <NotesDemo
    {safeMode}
    createRepository={(app) => {
      bindHistoryFixture(root, { app, fixture });
      return { reader: fixture.reader, close: () => fixture.close() };
    }}
  />
</div>

<style>
  .repository-demo {
    height: 46rem;
    min-height: 36rem;
  }
</style>
