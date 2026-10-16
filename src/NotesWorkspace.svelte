<script lang="ts">
  import { onMount, tick, untrack } from "svelte";
  import {
    App,
    installApplicationCompatibility,
    provideApplicationState,
    takeHostSyncService,
    type VaultSession,
  } from "@lapis-notes/api";
  import { DEFAULT_APP_STATE_DIRECTORY } from "@lapis-notes/api/path";
  import {
    WorkspaceShell,
    DesktopWorkspaceStartup,
  } from "@lapis-notes/workspace";
  import type { WorkspaceNavigation } from "@lapismd/design-core/workspace/app-shell";
  import type {
    WorkspaceStartupFailure,
    WorkspaceStartupTask,
  } from "@lapismd/design-core/workspace/startup";
  import { desktopNotesPlugins } from "./notes-plugins.ts";
  import FileConflicts from "./FileConflicts.svelte";

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
  let startupFailure = $state<WorkspaceStartupFailure | null>(null);
  let tasks = $state<WorkspaceStartupTask[]>([
    { id: "vault", label: "Open the vault", status: "pending" },
    { id: "configuration", label: "Load app configuration", status: "pending" },
    { id: "plugins", label: "Load configured core plugins", status: "pending" },
    { id: "layout", label: "Restore the workspace layout", status: "pending" },
    { id: "metadata", label: "Load note metadata", status: "pending" },
  ]);
  let stopMetadataTracking: (() => void) | undefined;
  let startup: Promise<void>;
  let shutdown: Promise<void> | undefined;
  let disposed = false;
  let coreDisposed = false;
  let section: HTMLElement | undefined;
  const workspaceNavigation = $derived<WorkspaceNavigation>({
    currentLabel: session.profile?.name ?? "Lapis Notes",
    menuLabel: "Vault",
    items: [
      {
        id: "current",
        label: session.profile?.name ?? "Lapis Notes",
        disabled: true,
      },
    ],
    manageLabel: "Back to vaults",
    onSelect: () => {},
    onManage: back,
  });

  function message(failure: unknown): string {
    return failure instanceof Error ? failure.message : String(failure);
  }

  function setTask(
    id: string,
    status: WorkspaceStartupTask["status"],
    detail?: string,
  ): void {
    tasks = tasks.map((task) =>
      task.id === id ? { ...task, status, detail } : task,
    );
  }

  async function initialize(): Promise<void> {
    let activeTask = "vault";
    async function phase(
      id: string,
      run: () => Promise<unknown>,
    ): Promise<void> {
      activeTask = id;
      setTask(id, "active");
      await run();
      setTask(id, "complete");
    }
    try {
      app.plugins.registerStaticPlugins(desktopNotesPlugins);
      await phase("vault", async () => {
        await app.vault.load();
        await app.vault.mkpath(DEFAULT_APP_STATE_DIRECTORY);
      });
      await phase("configuration", async () => {
        await app.configuration.load();
        await app.commands.loadHotkeys();
      });
      await phase("plugins", () =>
        app.plugins.loadPlugins({
          communityPlugins: "disabled",
          onProgress: ({ name }) =>
            setTask("plugins", "active", `Loading ${name}`),
        }),
      );
      await phase("layout", () => app.workspace.loadLayout());
      await phase("metadata", async () => {
        await app.metadataTypeManager.load();
        stopMetadataTracking = app.metadataTypeManager.trackChanges();
        await app.metadataCache.load();
        await onReady();
      });
      ready = true;
    } catch (failure) {
      setTask(activeTask, "failed");
      startupFailure = {
        title: "Lapis Notes could not start",
        description: "The workspace could not complete its startup sequence.",
        detail: message(failure),
        actions: [{ id: "back", label: "Back to vaults", onSelect: back }],
      };
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
      const focused = section?.ownerDocument.activeElement;
      if (focused instanceof HTMLElement && section?.contains(focused))
        focused.blur();
      await tick();
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
  bind:this={section}
  class="notes-session"
  data-notes-ready={ready}
  aria-label="Notes workspace"
  aria-busy={busy}
>
  {#if ready}
    <div class="notes-session-workspace" inert={busy}>
      <WorkspaceShell
        {app}
        {workspaceNavigation}
        displayMode="desktop"
        workspaceLabel={session.profile?.name}
      />
    </div>
  {:else}
    <DesktopWorkspaceStartup {tasks} failure={startupFailure} />
  {/if}
  <FileConflicts
    registry={app.fileEditingSessions.textConflicts}
    disabled={busy}
  />
  {#if error}<p role="alert">{error}</p>{/if}
</section>
