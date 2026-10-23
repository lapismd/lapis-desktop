<script lang="ts">
  import type { ComponentProps } from "svelte";
  import {
    RepositoryFileHistory,
    RepositoryShell,
  } from "@lapismd/repository-ui/jj";
  // Public File History usage requires its documented shell context because API views mount separately.
  let props: ComponentProps<typeof RepositoryFileHistory> = $props();
</script>

<div
  style="height:100%;--ui-shell-main-block-inset:0;--ui-shell-main-border:0;--ui-shell-main-radius:0;--ui-shell-toolbar-height:2.5rem"
>
  <RepositoryShell><RepositoryFileHistory {...props} /></RepositoryShell>
</div>
