<script lang="ts">
  import { onDestroy } from "svelte";
  import { registerCatalogCleanup } from "./lifecycle.ts";
  import VaultLauncher from "../../src/components/vaults/VaultLauncher.svelte";
  import {
    VaultClient,
    type NativeCall,
    type VaultDescriptor,
  } from "../../src/lib/native/vault-client";

  let {
    failure = false,
    canReturn = false,
    scenario = "normal",
  }: {
    failure?: boolean;
    canReturn?: boolean;
    scenario?: "normal" | "empty" | "cancel" | "pending";
  } = $props();
  let opened = $state("");
  let error = $state("");
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const unregister = registerCatalogCleanup(async () => {
    release();
  });
  onDestroy(() => {
    release();
    unregister();
  });
  const selected: VaultDescriptor = {
    profileId: "catalog-vault",
    sessionId: "catalog-session",
    name: "Research notes",
    path: "/catalog/research",
    resourceToken: "catalog-resource",
  };
  const call: NativeCall = async <T,>(
    command: string,
    args?: Parameters<NativeCall>[1],
  ) => {
    if (command === "vault_recents") {
      if (scenario === "empty") return [] as T;
      return [
        { id: selected.profileId, name: selected.name, path: selected.path },
      ] as T;
    }
    if (command === "vault_select" || command === "vault_open_recent") {
      if (scenario === "pending") {
        await pending;
        return null as T;
      }
      if (scenario === "cancel") return null as T;
      if (failure)
        throw new Error("The folder is unavailable. Try another vault.");
      return (
        (args as { create?: boolean })?.create
          ? { ...selected, name: "New notes" }
          : selected
      ) as T;
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
