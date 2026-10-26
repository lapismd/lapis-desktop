<script lang="ts">
  import { onDestroy } from "svelte";
  import {
    MemoryAppDatabase,
    type NativeBackgroundIndexing,
  } from "@lapis-notes/api";
  import NotesDemo from "../NotesDemo.svelte";
  import FixtureControls from "../../FixtureControls.svelte";
  import { registerCatalogCleanup } from "../lifecycle.ts";
  import { reviewLayout } from "./layout.ts";
  import { normalRecovery } from "../../../src/lib/notes/startup-recovery.ts";

  let {
    mode = "ready",
  }: {
    mode?: "ready" | "loading" | "failed" | "unsupported";
  } = $props();
  const database = new MemoryAppDatabase(crypto.randomUUID());
  database.rebuildSearchIndex = async () => {
    throw new Error("Native Search owns generated state");
  };
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const unregister = registerCatalogCleanup(async () => release());
  onDestroy(() => {
    release();
    unregister();
  });
  let search = false;
  let complete = false;
  const backgroundIndexing: NativeBackgroundIndexing = {
    async call(command) {
      if (command.kind === "select_search") search = true;
      if (command.kind === "disable_search") search = false;
      if (command.kind === "refresh") {
        if (search && command.rebuild && mode === "failed")
          throw new Error("Native Search service unavailable");
        if (search && command.rebuild && mode === "loading") await gate;
        complete = true;
      }
      return {
        status: {
          passes: complete ? 1 : 0,
          indexed: complete ? 1 : 0,
          deleted: 0,
          pending: complete ? 0 : 1,
          error: null,
          active: !complete,
          processed: complete ? 1 : 0,
          total: 1,
          phase: complete ? "idle" : search ? "search" : "metadata",
          completed_at: complete ? Date.now() : 0,
        },
        contribution:
          command.kind === "select_search"
            ? {
                projection_id: "search",
                placement:
                  mode === "unsupported" ? "client_dependent" : "native",
                message:
                  mode === "unsupported"
                    ? "Native Search cannot execute this custom provider"
                    : null,
              }
            : command.kind === "register_processor"
              ? {
                  projection_id: `processor:${command.owner_plugin_id}/${command.extension}`,
                  placement: "native",
                  message: null,
                }
              : null,
      };
    },
  };
  const layout = reviewLayout();
  layout.main.children[0]!.children[0]!.state = {
    type: "search",
    state: {},
    title: "Search",
    icon: "search",
  };
</script>

<NotesDemo
  {backgroundIndexing}
  appDatabase={database}
  files={{ ".lapis/workspace.json": JSON.stringify(layout) }}
  safeMode={{ ...normalRecovery(), active: true }}
/>
{#if mode === "loading"}
  <FixtureControls label="Native Search fixture">
    <button onclick={() => release()}>Complete native Search</button>
  </FixtureControls>
{/if}
