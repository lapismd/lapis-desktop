<script lang="ts">
  import ForgeAccounts from "./ForgeAccounts.svelte";
  import RemoteSettings from "./RemoteSettings.svelte";
  import RepositoryRestoreDialog from "../RepositoryRestoreDialog.svelte";
  import type { ForgeController } from "../../../lib/repository/forge-controller.ts";
  import type { RemoteController } from "../../../lib/repository/remote-controller.ts";
  import type { RestoreController } from "../../../lib/repository/restore.ts";
  let {
    controller,
    remote,
    restore,
  }: {
    controller: ForgeController;
    remote?: RemoteController;
    restore?: RestoreController;
  } = $props();
</script>

<ForgeAccounts {controller}>
  {#snippet remoteSettings()}
    {#if remote}<RemoteSettings
        controller={remote}
        accounts={controller}
        {restore}
      />{/if}
  {/snippet}
</ForgeAccounts>
{#if restore}<RepositoryRestoreDialog controller={restore} />{/if}
