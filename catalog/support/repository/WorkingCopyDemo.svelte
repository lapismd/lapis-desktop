<script lang="ts">
  import { untrack } from "svelte";
  import NotesDemo from "../NotesDemo.svelte";
  import { operationFixture } from "./operations.ts";
  import { bindHistoryFixture } from "./context.ts";
  import { commit, operation, revision } from "./fixture.ts";
  import { nativeError } from "../../../src/lib/native/native-error.ts";
  import type { WorkingCopyStatus } from "../../../src/lib/repository/working-copy-status.ts";
  let {
    scenario = "ready",
    roundedWindow = false,
  }: {
    scenario?: "ready" | "loading" | "binary" | "clean" | "failed";
    roundedWindow?: boolean;
  } = $props();
  const fixture = untrack(() => operationFixture());
  let attempts = 0,
    root: HTMLDivElement;
  async function read(): Promise<WorkingCopyStatus> {
    attempts++;
    if (scenario === "loading")
      await new Promise((resolve) => setTimeout(resolve, 1500));
    if (scenario === "failed" && attempts === 1)
      throw nativeError({
        code: "EAGAIN",
        message: "The working copy changed during status reading",
      });
    return {
      operation,
      revision,
      workspace: "default",
      changeId: commit().change_id,
      description: commit().description,
      author: { ...commit().author, email: "dev@lapis.md" },
      files: scenario === "clean" ? 0 : 2,
      lines:
        scenario === "binary"
          ? null
          : {
              additions: scenario === "clean" ? 0 : 1,
              deletions: scenario === "clean" ? 0 : 22,
            },
      uncounted: scenario === "binary" ? 1 : 0,
    };
  }
</script>

<div
  bind:this={root}
  data-repository-fixture
  class="working-copy-demo"
  class:rounded-window={roundedWindow}
>
  <NotesDemo
    createRepository={(app) => {
      bindHistoryFixture(root, { app, fixture });
      return {
        reader: fixture.reader,
        workingCopy: read,
        close: () => fixture.close(),
      };
    }}
  />
</div>

<style>
  .rounded-window {
    border: 1px solid var(--ui-workspace-border);
    border-radius: 12px;
    overflow: hidden;
  }
  .working-copy-demo {
    height: 100vh;
    min-height: 36rem;
  }
</style>
