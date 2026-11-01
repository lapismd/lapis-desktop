<script lang="ts">
  import { onMount } from "svelte";
  import type { App } from "@lapis-notes/api";
  import { bindFileConflictReviews } from "@lapis-notes/workspace";

  let {
    app,
    disabled = false,
  }: {
    app: App;
    disabled?: boolean;
  } = $props();

  onMount(() => bindFileConflictReviews(app, { disabled: () => disabled }));
</script>
