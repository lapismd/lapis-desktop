<script lang="ts">
  import { onMount } from "svelte";
  import {
    createVaultSession,
    MemoryAppDatabase,
    MemoryVaultAdapter,
    type VaultSession,
  } from "@lapis-notes/api";
  import NotesWorkspace from "../../src/components/views/NotesWorkspace.svelte";
  import { DesktopUrlDelivery } from "../../src/lib/native/integration-urls";
  import { normalRecovery } from "../../src/lib/notes/startup-recovery";
  import { registerCatalogCleanup } from "./lifecycle";

  let { class: className = "" }: { class?: string } = $props();

  let session = $state<VaultSession>();
  let workspace = $state<{ dispose(): Promise<void> }>();
  let failure = $state("");
  let ready = $state(false);
  const urls = new DesktopUrlDelivery(
    async <T,>() => null as T,
    (error) => {
      failure = String(error);
    },
  );
  onMount(() => {
    let disposed = false;
    const boot = createVaultSession(
      new MemoryVaultAdapter({
        "Welcome.md": "# A desktop catalog\n\nEdit this disposable note.\n",
      }),
      {
        runtime: "tauri-desktop",
        appDatabase: new MemoryAppDatabase(crypto.randomUUID()),
        profile: {
          id: crypto.randomUUID(),
          name: "Catalog vault",
          kind: "desktop-folder",
          handle: { rootPath: "/catalog" },
          createdAt: 0,
          updatedAt: 0,
        },
      },
    );
    void boot
      .then(async (value) => {
        if (disposed) await value.close();
        else session = value;
      })
      .catch((error) => {
        failure = String(error);
      });
    let shutdown: Promise<void> | undefined;
    const dispose = () =>
      (shutdown ??= (async () => {
        disposed = true;
        urls.dispose();
        const value = await boot;
        if (workspace) await workspace.dispose();
        else await value.close();
      })());
    const unregister = registerCatalogCleanup(dispose);
    return () => {
      unregister();
      void dispose().catch((error) => console.error(error));
    };
  });
</script>

<div class={`notes-demo ${className}`} data-catalog-ready={ready}>
  {#if session}
    <NotesWorkspace
      bind:this={workspace}
      {session}
      safeMode={normalRecovery()}
      urlDelivery={urls}
      onReady={async () => {
        ready = true;
      }}
      onBack={async () => {
        session = undefined;
      }}
      onRestart={async () => {
        throw new Error("Restart is native acceptance only");
      }}
    />
  {/if}
  {#if failure}<p role="alert">{failure}</p>{/if}
</div>

<style>
  .notes-demo {
    height: 100vh;
    min-width: 0;
  }
</style>
