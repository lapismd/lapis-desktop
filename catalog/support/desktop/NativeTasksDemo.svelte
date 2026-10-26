<script lang="ts">
  import { onDestroy } from "svelte";
  import type { NativeTasks } from "@lapis-notes/api/native-tasks";
  import NotesDemo from "../NotesDemo.svelte";
  import FixtureControls from "../../FixtureControls.svelte";
  import { registerCatalogCleanup } from "../lifecycle.ts";

  let { mode = "ready" }: { mode?: "ready" | "loading" | "failed" } = $props();
  let calls = $state<string[]>([]);
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const unregister = registerCatalogCleanup(async () => release());
  onDestroy(() => {
    release();
    unregister();
  });
  const nativeTasks: NativeTasks = {
    async call(command) {
      calls.push(command.kind);
      if (mode === "loading") await gate;
      if (mode === "failed")
        throw new Error("Native Tasks declaration unavailable");
      return {
        kind: "status",
        status: { enabled: false, configuration: null, tracked: null },
      };
    },
  };
</script>

<div class="native-tasks-demo" data-native-task-calls={calls.join(",")}>
  <NotesDemo {nativeTasks} />
  {#if mode === "loading"}
    <FixtureControls label="Native Tasks admission fixture">
      <button onclick={() => release()}
        >Complete native Tasks declaration</button
      >
    </FixtureControls>
  {/if}
</div>

<style>
  .native-tasks-demo {
    height: 100dvh;
    min-width: 0;
  }
</style>
