<script lang="ts">
  import { untrack } from "svelte";
  import NotesDemo from "../NotesDemo.svelte";
  import { operationFixture } from "./operations.ts";
  import { bindHistoryFixture } from "./context.ts";
  import type {
    AdoptionStatus,
    AdoptionRequest,
  } from "../../../src/lib/repository/adoption.ts";
  let {
    scenario = "available",
  }: {
    scenario?:
      | "available"
      | "pending"
      | "failed"
      | "loading"
      | "none"
      | "source-failure"
      | "unavailable";
  } = $props();
  const fixture = untrack(() => operationFixture());
  const original = untrack(() => operationFixture());
  const source = { operation: "ab".repeat(64), commit: "cd".repeat(20) };
  let saved: AdoptionStatus = untrack(() => ({
    source: scenario === "none" || scenario === "unavailable" ? null : source,
    source_unavailable: scenario === "unavailable",
    pending:
      scenario === "pending" || scenario === "unavailable"
        ? { request_id: "original-import", source }
        : null,
  }));
  let root: HTMLDivElement;
  let release: (() => void) | undefined;
  let loaded = false;
  async function accepted(request: AdoptionRequest) {
    root.dataset.adoptionRequest = request.request_id;
    root.dataset.adoptionDone = "true";
    return (saved = { ...saved, pending: null });
  }
</script>

<div bind:this={root} data-repository-fixture class="adoption-demo">
  {#if scenario === "loading"}<button
      onclick={() => {
        loaded = true;
        release?.();
      }}>Finish discovering original history</button
    >{/if}
  <NotesDemo
    createRepository={(app) => {
      bindHistoryFixture(root, { app, fixture });
      return {
        reader: fixture.reader,
        original: original.reader,
        async sources() {
          if (scenario === "source-failure")
            throw new Error("Original repository could not be inspected");
          return { original: scenario !== "none" };
        },
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
            throw new Error("Use the forge stories for account actions");
          },
          async openAuthorization() {},
        },
        backup: {
          async detach() {},
          async start() {
            return { phase: "ready", checkpoint: null, error: null };
          },
          async capture() {
            return { phase: "ready", checkpoint: null, error: null };
          },
          async stop() {},
        },
        adoption: {
          async status() {
            if (scenario === "loading" && !loaded)
              await new Promise<void>((done) => (release = done));
            return saved;
          },
          async adopt(request) {
            root.dataset.adoptionAttempt = request.request_id;
            if (scenario === "failed" && !saved.pending) {
              saved = { ...saved, pending: request };
              throw new Error("Original history import reply was lost");
            }
            return accepted(request);
          },
          async stop(id) {
            root.dataset.stoppedRequest = id;
            return (saved = { ...saved, pending: null });
          },
        },
        async close() {
          release?.();
          await Promise.all([fixture.close(), original.close()]);
        },
      };
    }}
  />
</div>

<style>
  .adoption-demo {
    height: 100vh;
    min-height: 36rem;
  }
</style>
