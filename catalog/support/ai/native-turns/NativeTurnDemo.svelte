<script lang="ts">
  import { untrack } from "svelte";
  import NotesDemo from "../../NotesDemo.svelte";
  import { nativeTurnFixture, registerNativeTurns } from "./fixture";
  let { unknown = false }: { unknown?: boolean } = $props();
  const fixture = untrack(() => nativeTurnFixture(unknown));
  let root: HTMLDivElement;
  $effect(() => {
    if (root) return registerNativeTurns(root, fixture);
  });
</script>

<div bind:this={root} data-native-turn-review>
  <NotesDemo nativeChat={fixture.create} />
</div>
