<script lang="ts">
  import { onDestroy } from "svelte";
  import type { NativeBackgroundIndexing } from "@lapis-notes/api";
  import NotesDemo from "../NotesDemo.svelte";
  import FixtureControls from "../../FixtureControls.svelte";
  import { registerCatalogCleanup } from "../lifecycle.ts";

  let { mode = "ready" }: { mode?: "ready" | "loading" | "failed" } = $props();
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const unregister = registerCatalogCleanup(async () => release());
  onDestroy(() => {
    release();
    unregister();
  });
  let finished = false;
  const backgroundIndexing: NativeBackgroundIndexing = {
    async call(command) {
      if (command.kind === "select_search" || command.kind === "disable_search")
        throw new Error(
          "Native Search selection is not available in the metadata intake",
        );
      if (command.kind === "refresh") {
        if (mode === "failed")
          throw new Error("Native metadata service unavailable");
        if (mode === "loading") await gate;
        finished = true;
      }
      return {
        status: {
          passes: finished ? 1 : 0,
          indexed: finished ? 3 : 1,
          deleted: 0,
          pending: finished ? 0 : 2,
          error: null,
          active: !finished,
          processed: finished ? 3 : 1,
          total: 3,
          phase: finished ? "idle" : "metadata",
        },
        contribution:
          command.kind === "register_processor"
            ? {
                projection_id: `processor:${command.owner_plugin_id}/${command.extension}`,
                placement: "native",
                message: null,
              }
            : null,
      };
    },
  };
</script>

<NotesDemo {backgroundIndexing} />
{#if mode === "loading"}
  <FixtureControls label="Native indexing fixture">
    <button onclick={() => release()}>Complete native indexing</button>
  </FixtureControls>
{/if}
