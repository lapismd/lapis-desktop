<script lang="ts">
  import { onMount, tick } from "svelte";
  import VaultLauncher from "./VaultLauncher.svelte";
  import NotesWorkspace from "./NotesWorkspace.svelte";
  import { openNotesSession } from "./notes-session.ts";
  import type { VaultSession } from "@lapis-notes/api";
  import type { VaultClient, VaultDescriptor } from "./vault-client.ts";
  let { client }: { client: VaultClient } = $props();
  let session = $state<VaultSession | null>(null);
  let selected = $state<VaultDescriptor | null>(null);
  let notes = $state<{ dispose(): Promise<void> }>();
  let restoring = $state(true);
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
    const operation = (async () => {
      session = await openNotesSession(target);
    })();
    opening = operation.catch(() => undefined);
    return operation;
  }

  async function back(): Promise<void> {
    await client.rememberNotes(null);
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

<header class="shell-header" data-tauri-drag-region>
  <span data-tauri-drag-region>Lapis Notes</span>
</header>
{#if failure}<p class="shell-failure" role="alert">{failure}</p>{/if}
<main
  class="shell-content"
  aria-labelledby="welcome-title"
  hidden={session !== null}
  inert={leaving}
>
  <div class="shell-welcome">
    <img src="/lapis-logo.svg" width="80" height="80" alt="" />
    <h1 id="welcome-title">A new home for your notes</h1>
    <p>Choose a folder for your notes.</p>
    {#if restoring}
      <p role="status">Restoring your notes…</p>
    {:else}
      <VaultLauncher {client} bind:active={selected} onOpenNotes={openNotes} />
    {/if}
  </div>
</main>
{#if session}
  {#key session}
    <NotesWorkspace
      bind:this={notes}
      {session}
      onBack={back}
      onReady={() => client.rememberNotes(selected)}
    />
  {/key}
{/if}
