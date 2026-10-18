<script lang="ts">
  import { onMount, untrack } from "svelte";
  import NotesDemo from "../NotesDemo.svelte";
  import { registerCatalogCleanup } from "../lifecycle.ts";
  import { backgroundFixture, registerBackground } from "./fixture.ts";
  let { failParsing = false }: { failParsing?: boolean } = $props();
  const fixture = untrack(() => backgroundFixture(failParsing));
  let root: HTMLDivElement;
  // Release delayed ports before the child workspace's awaited cleanup runs.
  const cleanup = registerCatalogCleanup(async () => fixture.release());
  onMount(() => {
    const unregister = registerBackground(root, fixture);
    return () => {
      fixture.release();
      cleanup();
      unregister();
    };
  });
</script>

<div bind:this={root} data-background-review>
  <NotesDemo
    createAi={fixture.createAi}
    createRepository={fixture.createRepository}
  />
</div>
