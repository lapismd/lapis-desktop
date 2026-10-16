<script lang="ts">
  import { onMount, tick } from "svelte";
  import VaultLauncher from "../vaults/VaultLauncher.svelte";
  import NotesWorkspace from "./NotesWorkspace.svelte";
  import { DesktopWorkspaceStartup } from "@lapis-notes/workspace";
  import { openNotesSession } from "../../lib/notes/notes-session.ts";
  import {
    normalRecovery,
    readRecovery,
    storeRecovery,
  } from "../../lib/notes/startup-recovery.ts";
  import type { VaultSession, AppSafeModeState } from "@lapis-notes/api";
  import type { DesktopUrlDelivery } from "../../lib/native/integration-urls.ts";
  import type {
    VaultClient,
    VaultDescriptor,
  } from "../../lib/native/vault-client.ts";
  let {
    client,
    urlDelivery,
  }: { client: VaultClient; urlDelivery: DesktopUrlDelivery } = $props();
  let safeMode = $state<AppSafeModeState>(normalRecovery());
  let session = $state<VaultSession | null>(null);
  let selected = $state<VaultDescriptor | null>(null);
  let returnProfileId = $state<string | null>(null);
  let notes = $state<{
    dispose(): Promise<void>;
    openVaults(): Promise<void>;
    canEdit(): boolean;
  }>();
  let restoring = $state(true);
  let openingNotes = $state(false);
  let leaving = $state(false);
  let failure = $state("");
  let restoration: Promise<void> = Promise.resolve();
  let opening: Promise<void> = Promise.resolve();
  let restarting: Promise<void> | undefined;

  export function reportFailure(error: unknown): void {
    failure = error instanceof Error ? error.message : String(error);
    leaving = false;
  }

  onMount(() => {
    restoration = (async () => {
      try {
        selected = await client.restore();
        if (selected) await openNotes(selected);
      } catch (error) {
        reportFailure(error);
      } finally {
        restoring = false;
      }
    })();
  });

  function openNotes(
    target: VaultDescriptor,
    recovery = readRecovery(target.profileId),
  ): Promise<void> {
    safeMode = recovery;
    failure = "";
    selected = target;
    openingNotes = true;
    const operation = (async () => {
      try {
        session = await openNotesSession(target);
      } catch (error) {
        await client.close(target);
        selected = null;
        reportFailure(error);
        throw error;
      } finally {
        openingNotes = false;
      }
    })();
    opening = operation.catch(() => undefined);
    return operation;
  }

  function restartNotes(mode: AppSafeModeState): Promise<void> {
    if (restarting) return restarting;
    restarting = (async () => {
      const target = selected;
      if (!target || !notes)
        throw new Error("No Notes session is available to restart");
      await notes.dispose();
      storeRecovery(target.profileId, mode);
      session = null;
      await tick();
      await openNotes(target, mode);
    })().finally(() => {
      restarting = undefined;
    });
    return restarting;
  }

  async function back(): Promise<void> {
    if (selected) storeRecovery(selected.profileId, normalRecovery());
    await client.rememberNotes(null);
    if (selected) await client.close(selected);
    selected = null;
    session = null;
  }

  export async function prepareToLeave(): Promise<void> {
    leaving = true;
    failure = "";
    await tick();
    await restoration;
    await opening;
    await tick();
    if (session) {
      if (!notes)
        throw new Error("The workspace is still starting. Please try again.");
      await notes.dispose();
    }
    await client.closeAll();
  }

  export async function openVaults(): Promise<void> {
    if (leaving) return;
    await restoration;
    await opening;
    if (leaving) return;
    if (notes) await notes.openVaults();
  }

  export function canEdit(): boolean {
    if (leaving || restoring || openingNotes) return false;
    return session ? (notes?.canEdit() ?? false) : true;
  }
</script>

{#if failure}<p class="shell-failure" role="alert">{failure}</p>{/if}
<main
  class="shell-content"
  data-tauri-drag-region="deep"
  aria-label="Vault launcher"
  hidden={session !== null}
  inert={leaving}
>
  {#if restoring || openingNotes}
    <DesktopWorkspaceStartup
      tasks={[
        {
          id: "restore",
          label: "Restore your notes",
          status: openingNotes ? "complete" : "active",
        },
        {
          id: "storage",
          label: "Open notes storage",
          status: openingNotes ? "active" : "pending",
        },
      ]}
    />
  {:else}
    <VaultLauncher
      {client}
      {returnProfileId}
      errorMessage={failure}
      onError={reportFailure}
      onOpenNotes={openNotes}
    />
  {/if}
</main>
{#if session}
  {#key session}
    <NotesWorkspace
      bind:this={notes}
      {session}
      {urlDelivery}
      {safeMode}
      onRestart={restartNotes}
      onBack={back}
      onReady={async () => {
        await client.rememberNotes(selected);
        returnProfileId = selected?.profileId ?? null;
      }}
    />
  {/key}
{/if}
