<script lang="ts">
  import type { ComponentProps } from "svelte";
  import {
    RepositoryFileHistory,
    RepositoryShell,
  } from "@lapismd/repository-ui/jj";
  // Public File History usage requires its documented shell context because API views mount separately.
  let props: ComponentProps<typeof RepositoryFileHistory> = $props();
</script>

<RepositoryShell><RepositoryFileHistory {...props} /></RepositoryShell>
