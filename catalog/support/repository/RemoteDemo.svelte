<script lang="ts">
  import { untrack } from "svelte";
  import NotesDemo from "../NotesDemo.svelte";
  import { operationFixture } from "./operations.ts";
  import { bindHistoryFixture } from "./context.ts";
  import type { RemoteSnapshot } from "../../../src/lib/repository/remote.ts";
  let {
    scenario = "empty",
  }: {
    scenario?:
      | "empty"
      | "connected"
      | "failed"
      | "loading"
      | "interrupted"
      | "signed-out";
  } = $props();
  const fixture = untrack(() => operationFixture());
  let root: HTMLDivElement;
  let release: (() => void) | undefined;
  let attempts = 0,
    restored = false,
    original = "",
    loadingFinished = false;
  const checkpoint = {
    operation: "a".repeat(128),
    commit: "b".repeat(40),
    change_id: "c".repeat(32),
    description: "Daily vault backup\n\nNotes and attachments retained.",
    timestamp_millis: 1792300000000,
  };
  let saved: RemoteSnapshot = untrack(() => ({
    revision: ["connected", "interrupted", "signed-out"].includes(scenario)
      ? 1
      : 0,
    configuration: ["connected", "interrupted", "signed-out"].includes(scenario)
      ? {
          account: "account",
          project: "lapis-fixture/notes",
          target: {
            url: "https://github.com/lapis-fixture/notes.git",
            branch: "main",
          },
          canPush: true,
        }
      : null,
    checkpoint: ["connected", "interrupted", "signed-out"].includes(scenario)
      ? checkpoint
      : null,
  }));
</script>

<div bind:this={root} data-repository-fixture class="remote-demo">
  {#if scenario === "loading"}<button
      onclick={() => {
        loadingFinished = true;
        release?.();
      }}>Finish remote loading</button
    >{/if}
  <NotesDemo
    createRepository={(app) => {
      bindHistoryFixture(root, { app, fixture });
      return {
        reader: fixture.reader,
        forges: {
          async inventory() {
            return {
              accounts:
                scenario === "signed-out"
                  ? []
                  : [
                      {
                        id: "account",
                        api_url: "https://api.github.com",
                        login: "lapis-fixture",
                        name: "Lapis fixture",
                        email: "dev@lapis.md",
                        avatar_url: null,
                        method: "pat",
                        available: true,
                      },
                    ],
              oauth_available: false,
              keychain_supported: true,
              authorization: null,
            };
          },
          async command() {
            throw new Error(
              "Account actions are covered in the account examples",
            );
          },
          async openAuthorization() {},
        },
        remote: {
          async status() {
            if (scenario === "loading" && !loadingFinished)
              await new Promise<void>((resolve) => (release = resolve));
            return saved;
          },
          async configure(revision, account, project, branch) {
            if (scenario === "failed" && attempts++ === 0)
              throw new Error("Remote setup failed");
            if (revision !== saved.revision)
              throw new Error("Connection changed");
            return (saved = {
              revision: revision + 1,
              configuration: {
                account,
                project,
                target: {
                  url: `https://github.com/${project}.git`,
                  branch: branch || "main",
                },
                canPush: true,
              },
              checkpoint: null,
            });
          },
          async disconnect(revision) {
            return (saved = {
              revision: revision + 1,
              configuration: null,
              checkpoint: null,
            });
          },
          async fetch() {
            return (saved = { ...saved, checkpoint });
          },
          async preview(commit) {
            return {
              checkpoint: commit,
              expected: "d".repeat(40),
              added: 2,
              modified: 1,
              deleted: 0,
            };
          },
          async restore(request) {
            original ||= request.request_id;
            if (original !== request.request_id)
              throw new Error("Original remote restore identity changed");
            root.dataset.originalRequest = original;
            root.dataset.restoreCalls = String(
              Number(root.dataset.restoreCalls || 0) + 1,
            );
            if (scenario === "interrupted" && !restored) {
              restored = true;
              throw new Error("Remote restore response was lost");
            }
            root.dataset.restoredRemote = request.checkpoint;
          },
          async keepCurrent() {
            root.dataset.keptCurrent = "true";
          },
        },
        async close() {
          release?.();
          await fixture.close();
        },
      };
    }}
  />
</div>

<style>
  .remote-demo {
    height: 100vh;
    min-height: 36rem;
  }
</style>
