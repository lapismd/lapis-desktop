<script lang="ts">
  import { untrack } from "svelte";
  import NotesDemo from "../NotesDemo.svelte";
  import { operationFixture } from "./operations.ts";
  import { bindHistoryFixture } from "./context.ts";
  let { scenario = "ready" }: { scenario?: "ready" | "failed" } = $props();
  const fixture = untrack(() => operationFixture());
  let root: HTMLDivElement;
  let attempts = 0;
  let originalRequest: string | undefined;
</script>

<div bind:this={root} data-repository-fixture class="restore-demo">
  <NotesDemo
    createRepository={(app) => {
      bindHistoryFixture(root, { app, fixture });
      return {
        reader: fixture.reader,
        restore: {
          async preview(checkpoint, path) {
            return {
              checkpoint,
              path,
              expected: "fixture-current-hash",
              bytes: 31,
              deleted: false,
            };
          },
          async apply(request) {
            originalRequest ??= request.request_id;
            if (originalRequest !== request.request_id)
              throw new Error("Restore request changed during retry");
            if (scenario === "failed" && attempts++ === 0)
              throw new Error("Restore response was lost");
            root.dataset.restoredFile = request.path;
          },
        },
        close: () => fixture.close(),
      };
    }}
  />
</div>

<style>
  .restore-demo {
    height: 100vh;
    min-height: 36rem;
  }
</style>
