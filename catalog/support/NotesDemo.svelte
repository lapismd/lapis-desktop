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
  import { registerNotesReadiness } from "./notes/readiness.ts";

  import type { NativeChatHost } from "@lapis-notes/app-profile/native-chat";
  import type { App } from "@lapis-notes/api";
  import type { TerminalFactory } from "../../src/lib/terminal/terminal-binding";
  import type { AiFactory } from "../../src/lib/ai/plugin/services";
  import type { RepositoryFactory } from "../../src/lib/repository/services.ts";
  import type { AppSafeModeState } from "@lapis-notes/api";

  let {
    class: className = "",
    createTerminal,
    createAi,
    nativeChat,
    createRepository,
    files = {},
    safeMode,
  }: {
    class?: string;
    createTerminal?: TerminalFactory;
    createAi?: AiFactory;
    nativeChat?: (app: App) => NativeChatHost;
    createRepository?: RepositoryFactory;
    files?: Record<string, string>;
    safeMode?: AppSafeModeState;
  } = $props();

  let session = $state<VaultSession>();
  let workspace = $state<{ dispose(): Promise<void> }>();
  let failure = $state("");
  let ready = $state(false);
  let root = $state<HTMLDivElement>();
  let finishStartup: () => void;
  let failStartup: (reason: unknown) => void;
  const startup = new Promise<void>((resolve, reject) => {
    finishStartup = resolve;
    failStartup = reject;
  });
  // Stories may observe only the visible error; explicit startup joins still reject.
  void startup.catch(() => undefined);
  const urls = new DesktopUrlDelivery(
    async <T,>() => null as T,
    (error) => {
      failure = String(error);
    },
  );
  onMount(() => {
    let disposed = false;
    const unregisterStartup = registerNotesReadiness(root!, startup);
    const boot = createVaultSession(
      new MemoryVaultAdapter({
        ...files,
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
        failStartup(error);
      });
    let shutdown: Promise<void> | undefined;
    const dispose = () =>
      (shutdown ??= (async () => {
        disposed = true;
        unregisterStartup();
        failStartup(new Error("Notes catalog closed before startup completed"));
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

<div
  bind:this={root}
  class={`notes-demo ${className}`}
  data-catalog-ready={ready}
>
  {#if session}
    <NotesWorkspace
      bind:this={workspace}
      {session}
      {createTerminal}
      {createAi}
      {nativeChat}
      {createRepository}
      safeMode={safeMode ?? normalRecovery()}
      urlDelivery={urls}
      onReady={async () => {
        ready = true;
        finishStartup();
      }}
      onBack={async () => {
        session = undefined;
      }}
      onRestart={async () => {
        throw new Error("Lapis could not restart. Please try again.");
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
