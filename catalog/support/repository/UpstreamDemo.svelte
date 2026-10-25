<script lang="ts">
  import { untrack } from "svelte";
  import NotesDemo from "../NotesDemo.svelte";
  import { operationFixture } from "./operations.ts";
  import { operation, revision, commit } from "./fixture.ts";
  import { bindHistoryFixture } from "./context.ts";
  import type { RemoteSnapshot } from "../../../src/lib/repository/remote.ts";
  let {
    scenario = "connected",
  }: {
    scenario?:
      | "connected"
      | "unfetched"
      | "disconnected"
      | "read-only"
      | "pending"
      | "failed";
  } = $props();
  const fixture = untrack(() => operationFixture());
  let root: HTMLDivElement;
  let incoming = 2,
    outgoing = 1,
    fetched = untrack(() => scenario !== "unfetched");
  let release: (() => void) | undefined;
  const checkpoint = {
    operation,
    commit: revision,
    change_id: commit().change_id,
    description: "Update project notes and reference links",
    timestamp_millis: Date.now() - 60_000,
  };
  const backup = { phase: "ready" as const, error: null, checkpoint };
  // Dataset text is deliberately simple: no ambient App or source IO.
  function action(name: string) {
    root.dataset.actions = [
      ...(root.dataset.actions?.split("|") ?? []),
      name,
    ].join("|");
  }
  function snapshot(): RemoteSnapshot {
    return {
      revision: 1,
      configuration:
        scenario === "disconnected"
          ? null
          : {
              account: "account",
              project: "lapis-fixture/notes",
              target: {
                url: "https://github.com/lapis-fixture/notes.git",
                branch: "main",
              },
              canPush: scenario !== "read-only",
            },
      checkpoint: fetched ? checkpoint : null,
      divergence:
        fetched && scenario !== "disconnected"
          ? {
              local_commit: revision,
              remote_commit: "d".repeat(40),
              incoming,
              outgoing,
            }
          : null,
    };
  }
</script>

<div bind:this={root} data-repository-fixture class="upstream-demo">
  {#if scenario === "pending"}<button onclick={() => release?.()}
      >Finish upstream fetch</button
    >{/if}
  <NotesDemo
    files={{
      ".lapis/repository-history.json": JSON.stringify({
        automaticSync: false,
      }),
    }}
    createRepository={(app) => {
      bindHistoryFixture(root, { app, fixture });
      return {
        reader: fixture.reader,
        backup: {
          detach: async () => {},
          start: async () => backup,
          capture: async () => backup,
          stop: async () => {
            release?.();
          },
        },
        remote: {
          status: async () => snapshot(),
          configure: async () => snapshot(),
          disconnect: async () => snapshot(),
          async fetch() {
            action("fetch");
            if (scenario === "pending")
              await new Promise<void>((done) => (release = done));
            if (scenario === "failed")
              throw new Error("Upstream is offline; local history is safe");
            fetched = true;
            return snapshot();
          },
          preview: async () => ({
            checkpoint: revision,
            expected: "tree",
            added: 0,
            modified: 0,
            deleted: 0,
          }),
          restore: async () => {},
          keepCurrent: async () => {
            action("capture");
          },
        },
        sync: {
          async prepare() {
            action("pull");
            return {
              local: checkpoint,
              incoming: checkpoint,
              candidate: checkpoint,
              conflicts: [],
            };
          },
          preview: async () => ({
            checkpoint: revision,
            expected: "tree",
            added: 0,
            modified: 1,
            deleted: 0,
          }),
          async apply() {
            action("apply");
            incoming = 0;
          },
          async publish() {
            action("push");
            outgoing = 0;
            return "complete" as const;
          },
          conflict: async (candidate, path) => ({ path, terms: [] }),
          resolve: async () => checkpoint,
        },
        close: async () => {
          release?.();
          await fixture.close();
        },
      };
    }}
  />
</div>

<style>
  .upstream-demo {
    height: 100vh;
    min-height: 36rem;
  }
</style>
