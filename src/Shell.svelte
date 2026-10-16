<script lang="ts">
  import { onMount, tick } from "svelte";
  import VaultLauncher from "./VaultLauncher.svelte";
  import NotesWorkspace from "./NotesWorkspace.svelte";
  import { DesktopWorkspaceStartup } from "@lapis-notes/workspace";
  import { openNotesSession } from "./notes-session.ts";
  import type { VaultSession } from "@lapis-notes/api";
  import type { VaultClient, VaultDescriptor } from "./vault-client.ts";
  let { client }: { client: VaultClient } = $props();
  let session = $state<VaultSession | null>(null);
  let selected = $state<VaultDescriptor | null>(null);
  let returnProfileId = $state<string | null>(null);
  let notes = $state<{ dispose(): Promise<void> }>();
  let restoring = $state(true);
  let openingNotes = $state(false);
  let leaving = $state(false);
  let failure = $state("");
  let restoration: Promise<void> = Promise.resolve();
  let opening: Promise<void> = Promise.resolve();

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

  function openNotes(target: VaultDescriptor): Promise<void> {
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

  async function back(): Promise<void> {
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
      onBack={back}
      onReady={async () => {
        await client.rememberNotes(selected);
        returnProfileId = selected?.profileId ?? null;
      }}
    />
  {/key}
{/if}
