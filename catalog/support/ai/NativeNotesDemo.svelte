<script lang="ts">
  import { untrack } from "svelte";
  import NotesDemo from "../NotesDemo.svelte";
  import { normalRecovery } from "../../../src/lib/notes/startup-recovery.ts";
  import { nativeNotesPorts, registerNativeNotes } from "./native-notes.ts";
  let {
    scenario = "unavailable",
  }: { scenario?: "unavailable" | "disabled" | "safe-mode" } = $props();
  const ports = untrack(nativeNotesPorts);
  let root = $state<HTMLElement>();
  $effect(() => {
    if (root) return registerNativeNotes(root, ports);
  });
  const files = $derived.by(() => {
    const seed: Record<string, string> = {};
    if (scenario === "disabled")
      seed[".lapis/core-plugins.json"] = JSON.stringify({
        disabled: ["ai"],
        enabled: [],
      });
    return seed;
  });
  const mode = $derived({
    ...normalRecovery(),
    ...(scenario === "safe-mode"
      ? { active: true, disableOptionalCorePlugins: true }
      : {}),
  });
</script>

<div bind:this={root} data-native-notes-review>
  <NotesDemo createAi={ports.create} {files} safeMode={mode} />
</div>
