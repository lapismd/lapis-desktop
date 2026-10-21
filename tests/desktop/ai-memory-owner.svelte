<script lang="ts">
  import { onMount, untrack } from "svelte";
  import {
    createMemoryProofOwner,
    type MemoryProofOwner,
  } from "./ai-memory-owner.ts";
  let {
    root,
    onReady,
    onFailure,
  }: {
    root: string;
    onReady(owner: MemoryProofOwner): void;
    onFailure(error: unknown): void;
  } = $props();
  const owner = untrack(() => createMemoryProofOwner(root));
  onMount(() => {
    void owner.ready.then(() => onReady(owner)).catch(onFailure);
    return () => {
      void owner.close().catch(onFailure);
    };
  });
</script>
