<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Shell from "../../../src/components/views/Shell.svelte";
  import {
    VaultClient,
    type NativeCall,
  } from "../../../src/lib/native/vault-client.ts";
  import { DesktopUrlDelivery } from "../../../src/lib/native/integration-urls.ts";
  import { registerCatalogCleanup } from "../lifecycle.ts";
  let {
    scenario = "restore-failed",
  }: { scenario?: "restoring" | "restore-failed" | "leave-failed" } = $props();
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const unregister = registerCatalogCleanup(async () => {
    release();
  });
  onDestroy(() => {
    release();
    unregister();
    urls.dispose();
  });
  const call: NativeCall = async <T,>(command: string) => {
    if (command === "vault_recents") return [] as T;
    if (command === "vault_restore") {
      if (scenario === "restoring") await held;
      if (scenario === "restore-failed")
        throw new Error(
          "The saved vault folder has moved. Open its current location.",
        );
      return null as T;
    }
    throw new Error(`Unexpected shell review request: ${command}`);
  };
  class ReviewVaultClient extends VaultClient {
    async closeAll(): Promise<void> {
      throw new Error(
        "Could not finish closing storage. Your session remains available.",
      );
    }
  }
  const client = new ReviewVaultClient(call);
  const urls = new DesktopUrlDelivery(async <T,>() => null as T, console.error);
  let shell: {
    prepareToLeave(): Promise<void>;
    reportFailure(error: unknown): void;
  };
  onMount(() => {
    if (scenario === "leave-failed")
      void shell.prepareToLeave().catch((error) => shell.reportFailure(error));
  });
</script>

<div class="shell-review">
  <Shell bind:this={shell} {client} urlDelivery={urls} />
</div>

<style>
  .shell-review {
    width: 100%;
    height: 100vh;
    min-width: 0;
  }
</style>
