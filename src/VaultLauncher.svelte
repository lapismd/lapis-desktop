<script lang="ts">
  import { onMount } from "svelte";
  import {
    VaultClient,
    type RecentVault,
    type VaultDescriptor,
    type VaultListing,
  } from "./vault-client.ts";

  let {
    client,
    onOpenNotes,
  }: {
    client: VaultClient;
    onOpenNotes(selected: VaultDescriptor): Promise<void>;
  } = $props();
  let recents = $state<RecentVault[]>([]);
  let active = $state<VaultDescriptor | null>(null);
  let listing = $state<VaultListing>({ files: [], folders: [] });
  let busy = $state(true);
  let error = $state("");
  let folderName = $state("");
  let status = $state("");

  function message(failure: unknown): string {
    return failure && typeof failure === "object" && "message" in failure
      ? String(failure.message)
      : "The vault could not be opened. Please try again.";
  }

  onMount(() => {
    client
      .recents()
      .then((profiles) => (recents = profiles))
      .catch((failure) => (error = message(failure)))
      .finally(() => (busy = false));
  });

  async function select(
    open: () => Promise<VaultDescriptor | null>,
  ): Promise<void> {
    busy = true;
    error = "";
    status = "Choosing a vault…";
    let selected: VaultDescriptor | null = null;
    try {
      selected = await open();
      if (!selected) {
        status = "Selection cancelled.";
        return;
      }
      const nextListing = await client.list(selected);
      if (active) await client.close(active);
      active = selected;
      listing = nextListing;
      recents = await client.recents();
      folderName = "";
      status = `Opened ${selected.name}.`;
    } catch (failure) {
      if (selected && selected !== active)
        await client.close(selected).catch(() => {});
      error = message(failure);
      status = "";
    } finally {
      busy = false;
    }
  }

  async function close(): Promise<void> {
    if (!active) return;
    busy = true;
    error = "";
    try {
      await client.close(active);
      active = null;
      listing = { files: [], folders: [] };
      status = "Vault closed.";
    } catch (failure) {
      error = message(failure);
    } finally {
      busy = false;
    }
  }

  async function openNotes(): Promise<void> {
    if (!active) return;
    busy = true;
    error = "";
    try {
      await onOpenNotes(active);
    } catch (failure) {
      error = message(failure);
    } finally {
      busy = false;
    }
  }
</script>

<section class="vault-launcher" aria-label="Vaults" aria-busy={busy}>
  {#if active}
    <h2>{active.name}</h2>
    <p class="vault-location">{active.path}</p>
    <p>Your folder is ready for your notes.</p>
    <button disabled={busy} onclick={openNotes}>Open notes</button>
    <button disabled={busy} onclick={close}>Close vault</button>
    <h3>Files and folders</h3>
    {#if listing.files.length || listing.folders.length}
      <ul class="vault-files" aria-label="Vault contents">
        {#each listing.folders as path}<li>{path}/</li>{/each}
        {#each listing.files as path}<li>{path}</li>{/each}
      </ul>
    {:else}
      <p>This vault is empty.</p>
    {/if}
  {/if}
  <div class="vault-actions">
    <button disabled={busy} onclick={() => select(() => client.select())}
      >Open vault…</button
    >
    <form
      onsubmit={(event) => {
        event.preventDefault();
        void select(() => client.select(folderName));
      }}
    >
      <label for="vault-name">New vault name</label>
      <div class="vault-create">
        <input
          id="vault-name"
          bind:value={folderName}
          maxlength="255"
          required
          disabled={busy}
        />
        <button type="submit" disabled={busy || !folderName.trim()}
          >Create vault…</button
        >
      </div>
    </form>
  </div>
  {#if recents.length}
    <h2>Recent vaults</h2>
    <ul class="vault-recents">
      {#each recents as profile (profile.id)}
        <li>
          <button
            disabled={busy}
            onclick={() => select(() => client.openRecent(profile.id))}
          >
            <span>{profile.name}</span><small>{profile.path}</small>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
  <p role="status">{busy ? "Opening vault…" : status}</p>
  {#if error}<p role="alert">{error}</p>{/if}
</section>
