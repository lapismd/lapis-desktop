<script lang="ts">
  import { onMount } from "svelte";
  import type { App, FileTextConflictRegistry } from "@lapis-notes/api";
  import { registerConflictReviews } from "./register-conflict-reviews.ts";

  let {
    app,
    registry = app.fileEditingSessions.textConflicts,
    disabled = false,
  }: {
    app: App;
    registry?: FileTextConflictRegistry;
    disabled?: boolean;
  } = $props();

  onMount(() => registerConflictReviews(app, registry, () => disabled));
</script>
