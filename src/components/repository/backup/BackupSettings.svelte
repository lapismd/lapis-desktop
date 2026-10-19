<script lang="ts">
  import { onMount } from "svelte";
  import RepositoryShell from "../RepositoryShell.svelte";
  import type { SyncController } from "../../../lib/repository/sync-controller.ts";
  import SyncConflictEditor from "./SyncConflictEditor.svelte";
  import SyncSettings from "./SyncSettings.svelte";
  import ForgeAccounts from "./ForgeAccounts.svelte";
  import RemoteSettings from "./RemoteSettings.svelte";
  import AdoptionSettings from "./AdoptionSettings.svelte";
  import type { AdoptionController } from "../../../lib/repository/adoption-controller.ts";
  import StorageSettings from "./StorageSettings.svelte";
  import type { StorageController } from "../../../lib/repository/storage-controller.ts";
  import RepositoryRestoreDialog from "../RepositoryRestoreDialog.svelte";
  import type { ForgeController } from "../../../lib/repository/forge-controller.ts";
  import type { RemoteController } from "../../../lib/repository/remote-controller.ts";
  import type { RestoreController } from "../../../lib/repository/restore.ts";
  let {
    controller,
    remote,
    restore,
    sync,
    setSyncEnabled,
    storage,
    adoption,
  }: {
    controller: ForgeController;
    remote?: RemoteController;
    restore?: RestoreController;
    sync?: SyncController;
    setSyncEnabled?: (enabled: boolean) => Promise<void>;
    storage?: StorageController;
    adoption?: AdoptionController;
  } = $props();
  let conflictsOpen = $state(false);
  onMount(() => {
    let active = false;
    return sync?.subscribe((snapshot) => {
      if (active && !snapshot.busy) void remote?.refresh();
      active = snapshot.busy;
    });
  });
</script>

<RepositoryShell>
  <ForgeAccounts {controller}>
    {#snippet remoteSettings()}
      {#if storage}<StorageSettings controller={storage} />{/if}
      {#if adoption}<AdoptionSettings controller={adoption} />{/if}
      {#if sync && setSyncEnabled}<SyncSettings
          controller={sync}
          setEnabled={setSyncEnabled}
          onReview={() => (conflictsOpen = true)}
        />{/if}
      {#if remote}<RemoteSettings
          controller={remote}
          accounts={controller}
          {restore}
        />{/if}
    {/snippet}
  </ForgeAccounts>
  {#if restore}<RepositoryRestoreDialog controller={restore} />{/if}
  {#snippet surface()}
    {#if sync}<SyncConflictEditor
        controller={sync}
        open={conflictsOpen}
        onClose={() => (conflictsOpen = false)}
      />{/if}
  {/snippet}
</RepositoryShell>
