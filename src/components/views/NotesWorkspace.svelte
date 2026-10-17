<script lang="ts">
  import type { PluginAssetServer } from "@lapis-notes/api/plugin-assets";
  import { onMount, tick, untrack } from "svelte";
  import {
    App,
    installApplicationCompatibility,
    provideApplicationState,
    takeHostSyncService,
    type VaultSession,
    type AppSafeModeState,
    type AppPluginDistributionOptions,
  } from "@lapis-notes/api";
  import {
    WorkspaceShell,
    registerPluginManagementSettings,
    DesktopWorkspaceStartup,
    DesktopRecoveryBanner,
  } from "@lapis-notes/workspace";
  import type { WorkspaceNavigation } from "@lapismd/design-core/workspace/app-shell";
  import type {
    WorkspaceStartupFailure,
    WorkspaceStartupTask,
  } from "@lapismd/design-core/workspace/startup";
  import {
    startNotes,
    startupTasks,
    StartupPhaseError,
  } from "../../lib/notes/notes-startup.ts";
  import { unavailableDesktopPlugins } from "../../lib/notes/plugin-policy.ts";
  import { registerDesktopPluginBrowser } from "../../lib/notes/notes-plugin-browser.ts";
  import { NotesRecovery } from "../../lib/notes/notes-recovery.svelte.ts";
  import FileConflicts from "../files/FileConflicts.svelte";
  import { leaveWithStoppedWatching } from "../../lib/notes/notes-leave.ts";
  import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
  import { attachNotesUrls } from "../../lib/notes/notes-integration.ts";
  import type { DesktopUrlDelivery } from "../../lib/native/integration-urls.ts";

  import type { TerminalFactory } from "../../lib/terminal/terminal-binding.ts";
  import type { AiFactory } from "../../lib/ai/plugin/services.ts";
  import type { RepositoryFactory } from "../../lib/repository/services.ts";
  import { notesBundledPlugins } from "./notes-bundled-plugins.ts";

  let {
    session,
    pluginAssetServer,
    pluginDistributionOptions,
    createTerminal,
    createAi,
    createRepository,
    onBack,
    onReady,
    onRestart,
    safeMode,
    urlDelivery,
  }: {
    session: VaultSession;
    pluginAssetServer?: PluginAssetServer;
    pluginDistributionOptions?: AppPluginDistributionOptions;
    createTerminal?: TerminalFactory;
    createAi?: AiFactory;
    createRepository?: RepositoryFactory;
    onBack(): Promise<void>;
    onReady(): Promise<void>;
    onRestart(mode: AppSafeModeState): Promise<void>;
    safeMode: AppSafeModeState;
    urlDelivery: DesktopUrlDelivery;
  } = $props();
  const app = untrack(
    () =>
      new App({
        version: "0.1.0",
        session,
        pluginAssetServer,
        pluginDistributionOptions,
        unavailablePlugins: createAi ? {} : unavailableDesktopPlugins,
        safeMode,
        workspaceShell: { notifications: true },
        markdownRenderer: async () => {},
      }),
  );
  const bundled = untrack(() =>
    notesBundledPlugins(app, createTerminal, createAi, createRepository),
  );
  provideApplicationState(app);
  const releaseCompatibility = installApplicationCompatibility(app);
  const sync = takeHostSyncService(app);
  const disposePluginSettings = registerPluginManagementSettings(app);
  const disposePluginBrowser = registerDesktopPluginBrowser(app);
  let ready = $state(false);
  let busy = $state(true);
  let error = $state("");
  let startupFailure = $state<WorkspaceStartupFailure | null>(null);
  const recovery = untrack(() => new NotesRecovery(app, onRestart));
  let tasks = $state<WorkspaceStartupTask[]>(startupTasks());
  let stopMetadataTracking: (() => void) | undefined;
  let stopUrls: (() => void) | undefined;
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
    try {
      await startNotes(app, {
        registerBundledPlugins: bundled.register,
        setTask,
        onMetadataTracking: (stop) => {
          stopMetadataTracking = stop;
        },
        onReady,
      });
      ready = true;
      await tick();
      try {
        await getWorkspaceHostBinding(app.workspace).controller.start();
      } catch (failure) {
        ready = false;
        setTask("layout", "failed");
        throw new StartupPhaseError("layout", failure);
      }
      if (!shutdown) stopUrls = attachNotesUrls(app, urlDelivery);
    } catch (failure) {
      const task =
        failure instanceof StartupPhaseError ? failure.task : "vault";
      const cause =
        failure instanceof StartupPhaseError ? failure.failure : failure;
      const result = recovery.failure(task, cause);
      startupFailure = {
        ...result,
        actions: [
          ...(result.actions ?? []),
          { id: "back", label: "Back to vaults", onSelect: back },
        ],
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

  export function dispose(mode: "close" | "reload" = "close"): Promise<void> {
    if (shutdown) return shutdown;
    if (disposed) return Promise.resolve();
    busy = true;
    stopUrls?.();
    stopUrls = undefined;
    error = "";
    shutdown = (async () => {
      const focused = section?.ownerDocument.activeElement;
      // Settings and editor controls can be portalled outside this section.
      if (focused instanceof HTMLElement) focused.blur();
      await tick();
      await startup;
      busy = true;
      if (!coreDisposed) {
        await leaveWithStoppedWatching(
          app,
          async () => {
            await app.workspace.flushPluginChanges();
            await app.plugins.flushPendingConfigWrites();
            await app.fileEditingSessions.settleOperations();
            await app.fileEditingSessions.guard(undefined, async () => {
              await app.workspace.flushLayout();
              bundled.prepareLeave(mode);
              ready = false;
              await app.workspace.disposeWorkspaceHost();
              stopMetadataTracking?.();
              await app.metadataCache.dispose();
              for (const plugin of [...app.plugins.plugins.values()].reverse())
                await plugin.disable();
              await sync.dispose();
              disposePluginSettings();
              disposePluginBrowser();
              coreDisposed = true;
            });
          },
          () => ready && !coreDisposed,
        );
      }
      await app.fileEditingSessions.dispose();
      await session.close();
      bundled.dispose();
      releaseCompatibility();
      disposed = true;
    })().catch((failure) => {
      shutdown = undefined;
      error = message(failure);
      busy = false;
      if (ready && !coreDisposed) stopUrls = attachNotesUrls(app, urlDelivery);
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

  export async function openVaults(): Promise<void> {
    if (busy || disposed) return;
    await back();
  }

  export function canEdit(): boolean {
    return ready && !busy && !disposed;
  }
</script>

<section
  bind:this={section}
  class="notes-session"
  data-notes-ready={ready && !busy}
  role="group"
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
    {#if app.safeMode.active}
      <DesktopRecoveryBanner
        reasons={recovery.reasons}
        lastFailure={app.safeMode.lastStartupFailure?.message}
        message={recovery.message}
        metadataBusy={recovery.metadataBusy}
        searchBusy={recovery.searchBusy}
        disabled={busy}
        onRebuildMetadata={() => recovery.rebuild("metadata")}
        onRebuildSearch={() => recovery.rebuild("search")}
        onRestart={() => recovery.normal()}
      />
    {/if}
  {:else}
    <DesktopWorkspaceStartup {tasks} failure={startupFailure} />
    {#if recovery.message}<p role="status">{recovery.message}</p>{/if}
  {/if}
  <FileConflicts
    {app}
    registry={app.fileEditingSessions.textConflicts}
    disabled={busy}
  />
  {#if error}<p role="alert">{error}</p>{/if}
</section>
