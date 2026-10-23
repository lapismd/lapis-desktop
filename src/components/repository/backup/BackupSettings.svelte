<script lang="ts">
  import { onMount } from "svelte";
  import RepositoryShell from "../RepositoryShell.svelte";
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import type { SyncController } from "../../../lib/repository/sync-controller.ts";
  import SyncConflictEditor from "./SyncConflictEditor.svelte";
  import SyncSettings from "./SyncSettings.svelte";
  import ForgeAccounts from "./ForgeAccounts.svelte";
  import RemoteSettings from "./RemoteSettings.svelte";
  import AdoptionSettings from "./AdoptionSettings.svelte";
  import type { AdoptionController } from "../../../lib/repository/adoption-controller.ts";
  import StorageSettings from "./StorageSettings.svelte";
  import type { StorageController } from "../../../lib/repository/storage-controller.ts";
  import { RepositoryRestoreDialog } from "@lapismd/repository-ui/jj";
  import type { ForgeController } from "../../../lib/repository/forge-controller.ts";
  import type { RemoteController } from "../../../lib/repository/remote-controller.ts";
  import type { RestoreController } from "@lapismd/repository-ui/history";
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
  let syncBusy = $state(false);
  onMount(() => {
    let active = false;
    return sync?.subscribe((snapshot) => {
      syncBusy = snapshot.busy;
      if (active && !snapshot.busy) void remote?.refresh();
      active = snapshot.busy;
    });
  });
</script>

<div class="backup-settings-content">
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
</div>
{#if sync && conflictsOpen}
  <Dialog.Root
    open={conflictsOpen}
    onOpenChange={(value) => {
      if (value || !syncBusy) conflictsOpen = value;
    }}
  >
    <Dialog.Content
      class="backup-conflicts-dialog"
      showCloseButton={false}
      onEscapeKeydown={(event) => {
        if (syncBusy) event.preventDefault();
      }}
    >
      <Dialog.Title class="visually-hidden"
        >Resolve backup synchronization conflicts</Dialog.Title
      >
      <Dialog.Description class="visually-hidden"
        >Review and resolve retained local and remote changes.</Dialog.Description
      >
      <RepositoryShell>
        {#snippet surface()}<SyncConflictEditor
            controller={sync}
            open={conflictsOpen}
            onClose={() => (conflictsOpen = false)}
          />{/snippet}
        <div></div>
      </RepositoryShell>
    </Dialog.Content>
  </Dialog.Root>
{/if}

<style>
  .backup-settings-content {
    display: grid;
    gap: 1rem;
    min-width: 0;
    width: 100%;
  }
  :global(.backup-conflicts-dialog) {
    width: 100dvw;
    max-width: 100dvw;
    height: 100dvh;
    max-height: 100dvh;
    padding: 0;
    gap: 0;
    border: 0;
    border-radius: 0;
  }
  :global(.backup-conflicts-dialog .visually-hidden) {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
</style>
