<script lang="ts">
  import { untrack } from "svelte";
  import NotesDemo from "../NotesDemo.svelte";
  import { operationFixture } from "./operations.ts";
  import { bindHistoryFixture } from "./context.ts";
  import { operation, revision, commit } from "./fixture.ts";
  import type { BackupStatus } from "../../../src/lib/repository/backup.ts";
  let {
    scenario = "ready",
  }: { scenario?: "ready" | "saving" | "failed" | "starting" } = $props();
  const fixture = untrack(() => operationFixture());
  let root: HTMLDivElement;
  let listener: ((state: BackupStatus) => void) | undefined;
  const ready: BackupStatus = {
    phase: "ready",
    error: null,
    checkpoint: {
      operation,
      commit: revision,
      change_id: commit().change_id,
      description: "Automatic vault backup",
      timestamp_millis: Date.now() - 60_000,
    },
  };
  let stops = 0;
  let finishStart: (() => void) | undefined;
</script>

<div bind:this={root} data-repository-fixture class="backup-demo">
  {#if scenario === "starting"}<button onclick={() => finishStart?.()}
      >Finish initial backup</button
    >{/if}
  <NotesDemo
    createRepository={(app) => {
      bindHistoryFixture(root, { app, fixture });
      return {
        reader: fixture.reader,
        backup: {
          async detach() {},
          async start(changed) {
            listener = changed;
            root.dataset.backupStops = String(stops);
            if (scenario === "starting")
              await new Promise<void>((resolve) => {
                finishStart = resolve;
              });
            if (scenario === "saving")
              return { phase: "saving", checkpoint: null, error: null };
            if (scenario === "failed")
              return {
                phase: "failed",
                checkpoint: null,
                error: "Backup storage is unavailable",
              };
            return ready;
          },
          async capture() {
            listener?.(ready);
            return ready;
          },
          async stop() {
            finishStart?.();
            stops++;
            if (root) root.dataset.backupStops = String(stops);
          },
        },
        close: () => fixture.close(),
      };
    }}
  />
</div>

<style>
  .backup-demo {
    height: 100vh;
    min-height: 36rem;
  }
</style>
