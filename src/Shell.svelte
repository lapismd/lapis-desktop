<script lang="ts">
  import VaultLauncher from "./VaultLauncher.svelte";
  import NotesWorkspace from "./NotesWorkspace.svelte";
  import { openNotesSession } from "./notes-session.ts";
  import type { VaultSession } from "@lapis-notes/api";
  import type { VaultClient, VaultDescriptor } from "./vault-client.ts";
  let { client }: { client: VaultClient } = $props();
  let session = $state<VaultSession | null>(null);

  async function openNotes(selected: VaultDescriptor): Promise<void> {
    session = await openNotesSession(selected);
  }
</script>

<header class="shell-header" data-tauri-drag-region>
  <span data-tauri-drag-region>Lapis Notes</span>
</header>
<main
  class="shell-content"
  aria-labelledby="welcome-title"
  hidden={session !== null}
>
  <div class="shell-welcome">
    <img src="/lapis-logo.svg" width="80" height="80" alt="" />
    <h1 id="welcome-title">A new home for your notes</h1>
    <p>Choose a folder for your notes.</p>
    <VaultLauncher {client} onOpenNotes={openNotes} />
  </div>
</main>
{#if session}
  <NotesWorkspace
    {session}
    onBack={() => {
      session = null;
    }}
  />
{/if}
