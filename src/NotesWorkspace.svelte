<script lang="ts">
  import { onMount, untrack } from "svelte";
  import {
    App,
    installApplicationCompatibility,
    provideApplicationState,
    takeHostSyncService,
    type VaultSession,
  } from "@lapis-notes/api";
  import { DEFAULT_APP_STATE_DIRECTORY } from "@lapis-notes/api/path";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { desktopNotesPlugins } from "./notes-plugins.ts";
  import { requestReload } from "./desktop-lifecycle.ts";

  let {
    session,
    onBack,
    onReady,
  }: {
    session: VaultSession;
    onBack(): Promise<void>;
    onReady(): Promise<void>;
  } = $props();
  const app = untrack(
    () =>
      new App({
        version: "0.1.0",
        session,
        workspaceShell: { notifications: true },
        markdownRenderer: async () => {},
      }),
  );
  provideApplicationState(app);
  const releaseCompatibility = installApplicationCompatibility(app);
  const sync = takeHostSyncService(app);
  let ready = $state(false);
  let busy = $state(true);
  let error = $state("");
  let stopMetadataTracking: (() => void) | undefined;
  let startup: Promise<void>;
  let shutdown: Promise<void> | undefined;
  let disposed = false;
  let coreDisposed = false;

  function message(failure: unknown): string {
    return failure instanceof Error ? failure.message : String(failure);
  }

  async function initialize(): Promise<void> {
    try {
      app.plugins.registerStaticPlugins(desktopNotesPlugins);
      await app.vault.load();
      await app.vault.mkpath(DEFAULT_APP_STATE_DIRECTORY);
      await app.configuration.load();
      await app.plugins.loadPlugins({ communityPlugins: "disabled" });
      await app.workspace.loadLayout();
      stopMetadataTracking = app.metadataTypeManager.trackChanges();
      await app.metadataCache.load();
      await onReady();
      ready = true;
    } catch (failure) {
      error = message(failure);
    } finally {
      busy = false;
    }
  }

  onMount(() => {
    startup = initialize();
    return () => {
      if (!disposed)
        void dispose().catch((failure) =>
          console.error("Notes teardown failed", failure),
        );
    };
  });

  export function dispose(): Promise<void> {
    if (shutdown) return shutdown;
    if (disposed) return Promise.resolve();
    busy = true;
    error = "";
    shutdown = (async () => {
      await startup;
      busy = true;
      if (!coreDisposed) {
        await app.fileEditingSessions.guard(undefined, async () => {
          await app.workspace.flushLayout();
          ready = false;
          await app.workspace.disposeWorkspaceHost();
          stopMetadataTracking?.();
          await app.metadataCache.dispose();
          for (const plugin of [...app.plugins.corePlugins].reverse())
            await plugin.disable();
          await sync.dispose();
          coreDisposed = true;
        });
      }
      await app.fileEditingSessions.dispose();
      await session.close();
      releaseCompatibility();
      disposed = true;
    })().catch((failure) => {
      shutdown = undefined;
      error = message(failure);
      busy = false;
      throw failure;
    });
    return shutdown;
  }

  async function back(): Promise<void> {
    busy = true;
    error = "";
    try {
      await dispose();
      await onBack();
    } catch (failure) {
      error = message(failure);
      busy = false;
    }
  }
</script>

<section
  class="notes-session"
  data-notes-ready={ready}
  aria-label="Notes workspace"
  aria-busy={busy}
>
  <div class="notes-session-toolbar">
    <strong>{session.profile?.name ?? "Lapis Notes"}</strong>
    <button disabled={busy} onclick={back}>Back to vaults</button>
    <button
      disabled={busy}
      onclick={() =>
        requestReload().catch((failure) => {
          error = message(failure);
        })}>Reload notes</button
    >
  </div>
  {#if error}<p role="alert">{error}</p>{/if}
  {#if ready}
    <div class="notes-session-workspace" inert={busy}>
      <WorkspaceShell
        {app}
        displayMode="desktop"
        workspaceLabel={session.profile?.name}
      />
    </div>
  {:else if busy}
    <p role="status">Opening your notes…</p>
  {/if}
</section>
