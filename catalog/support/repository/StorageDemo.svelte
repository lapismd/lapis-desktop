<script lang="ts">
  import { untrack } from "svelte";
  import NotesDemo from "../NotesDemo.svelte";
  import { operationFixture } from "./operations.ts";
  import { bindHistoryFixture } from "./context.ts";
  import type { StorageStatus } from "../../../src/lib/repository/storage.ts";
  let {
    scenario = "external",
  }: {
    scenario?:
      | "external"
      | "colocated"
      | "pending"
      | "loading"
      | "failed"
      | "moving";
  } = $props();
  const fixture = untrack(() => operationFixture());
  let root: HTMLDivElement;
  let release: (() => void) | undefined;
  let loadingFinished = false;
  let moveFinished = false;
  let saved: StorageStatus = untrack(() => ({
    revision: scenario === "colocated" ? 1 : 0,
    location: scenario === "colocated" ? "colocated" : "external",
    pending:
      scenario === "pending"
        ? {
            request_id: "original-move",
            location: "colocated",
            phase: "archived",
          }
        : null,
  }));
</script>

<div bind:this={root} data-repository-fixture class="storage-demo">
  {#if scenario === "moving"}<button
      onclick={() => {
        moveFinished = true;
        release?.();
      }}>Finish moving history storage</button
    >{/if}
  {#if scenario === "loading"}<button
      onclick={() => {
        loadingFinished = true;
        release?.();
      }}>Finish loading history storage</button
    >{/if}
  <NotesDemo
    createRepository={(app) => {
      bindHistoryFixture(root, { app, fixture });
      return {
        reader: fixture.reader,
        forges: {
          async inventory() {
            return {
              accounts: [],
              oauth_available: false,
              keychain_supported: true,
              authorization: null,
            };
          },
          async command() {
            throw new Error("Account actions use the account stories");
          },
          async openAuthorization() {},
        },
        storage: {
          async status() {
            if (scenario === "loading" && !loadingFinished)
              await new Promise<void>((done) => (release = done));
            return saved;
          },
          async change(revision, location, requestId) {
            if (revision !== saved.revision)
              throw new Error("Storage settings changed");
            root.dataset.storageRequest = requestId;
            if (scenario === "moving" && !moveFinished)
              await new Promise<void>((done) => (release = done));
            if (scenario === "failed") {
              saved = {
                ...saved,
                pending: { request_id: requestId, location, phase: "archived" },
              };
              throw new Error("History storage move was interrupted");
            }
            root.dataset.storageLocation = location;
            return (saved = {
              revision: revision + 1,
              location,
              pending: null,
            });
          },
          async recover() {
            root.dataset.recoveredRequest = saved.pending?.request_id;
            root.dataset.storageLocation =
              saved.pending?.location ?? saved.location;
            return (saved = {
              revision: saved.revision + 1,
              location: saved.pending?.location ?? saved.location,
              pending: null,
            });
          },
          async rollback(requestId) {
            root.dataset.rolledBackRequest = requestId;
            return (saved = { ...saved, pending: null });
          },
          async reload() {
            root.dataset.storageReloads = String(
              Number(root.dataset.storageReloads ?? 0) + 1,
            );
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
  .storage-demo {
    height: 100vh;
    min-height: 36rem;
  }
</style>
