<script lang="ts">
  import VaultLauncher from "../../src/components/vaults/VaultLauncher.svelte";
  import {
    VaultClient,
    type NativeCall,
    type VaultDescriptor,
  } from "../../src/lib/native/vault-client";

  let {
    failure = false,
    canReturn = false,
  }: {
    failure?: boolean;
    canReturn?: boolean;
  } = $props();
  let opened = $state("");
  let error = $state("");
  const selected: VaultDescriptor = {
    profileId: "catalog-vault",
    sessionId: "catalog-session",
    name: "Research notes",
    path: "/catalog/research",
    resourceToken: "catalog-resource",
  };
  const call: NativeCall = async <T,>(command: string) => {
    if (command === "vault_recents")
      return [
        { id: selected.profileId, name: selected.name, path: selected.path },
      ] as T;
    if (command === "vault_select" || command === "vault_open_recent") {
      if (failure)
        throw new Error("The folder is unavailable. Try another vault.");
      return selected as T;
    }
    throw new Error(`Unexpected catalog native request: ${command}`);
  };
  const client = new VaultClient(call);
</script>

<VaultLauncher
  {client}
  returnProfileId={canReturn ? selected.profileId : null}
  errorMessage={error}
  onOpenNotes={async (vault) => {
    opened = vault.name;
  }}
  onError={(failure) => {
    error = String(failure);
  }}
/>
{#if opened}<output data-testid="opened-vault">{opened}</output>{/if}
