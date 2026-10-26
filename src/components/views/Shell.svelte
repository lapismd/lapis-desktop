<script lang="ts">
  import { onMount, tick } from "svelte";
  import VaultLauncher from "../vaults/VaultLauncher.svelte";
  import { createNativePluginAssetServer } from "../../lib/native/plugin-assets.ts";
  import NotesWorkspace from "./NotesWorkspace.svelte";
  import DesktopFailure from "./DesktopFailure.svelte";
  import { DesktopWorkspaceStartup } from "@lapis-notes/workspace";
  import { createNativeTerminal } from "../../lib/native/native-terminal.ts";
  import { createNativeChatHost } from "../../lib/native/ai/native-chat.ts";
  import { createNativeAi } from "../../lib/native/ai/services.ts";
  import { createNativeRepository } from "../../lib/native/repository/services.ts";
  import type { AiServices } from "../../lib/ai/plugin/services.ts";
  import type { DesktopPopouts } from "../../lib/desktop/workspace-popouts.ts";
  import { openNotesSession } from "../../lib/notes/notes-session.ts";
  import {
    normalRecovery,
    readRecovery,
    storeRecovery,
  } from "../../lib/notes/startup-recovery.ts";
  import type {
    VaultSession,
    AppSafeModeState,
    AppPluginDistributionOptions,
  } from "@lapis-notes/api";
  import type { DesktopUrlDelivery } from "../../lib/native/integration-urls.ts";
  import type {
    VaultClient,
    VaultDescriptor,
  } from "../../lib/native/vault-client.ts";
  let {
    client,
    urlDelivery,
    pluginDistributionOptions,
    createPopouts,
    createAi = (app, vault, tools) => createNativeAi(app, vault, { tools }),
  }: {
    client: VaultClient;
    urlDelivery: DesktopUrlDelivery;
    pluginDistributionOptions?: AppPluginDistributionOptions;
    createPopouts?: (
      app: import("@lapis-notes/api").App,
      vault: VaultDescriptor,
    ) => Promise<DesktopPopouts>;
    createAi?: (
      app: import("@lapis-notes/api").App,
      vault: VaultDescriptor,
      tools: import("../../lib/ai/tools/app-tool-host.ts").AppToolHost,
    ) => AiServices;
  } = $props();
  const coreChat = document.documentElement.dataset.aiOwner === "core";
  const metadataOwner =
    document.documentElement.dataset.metadataOwner === "core"
      ? "core"
      : "renderer";
  const editingOwner =
    document.documentElement.dataset.editingOwner === "core"
      ? "core"
      : "renderer";
  let safeMode = $state<AppSafeModeState>(normalRecovery());
  let session = $state<VaultSession | null>(null);
  let selected = $state<VaultDescriptor | null>(null);
  let returnProfileId = $state<string | null>(null);
  let notes = $state<{
    dispose(mode?: "close" | "reload"): Promise<void>;
    openVaults(): Promise<void>;
    canEdit(): boolean;
  }>();
  let restoring = $state(true);
  let openingNotes = $state(false);
  let leaving = $state(false);
  let failure = $state("");
  let restoration: Promise<void> = Promise.resolve();
  let opening: Promise<void> = Promise.resolve();
  let restarting: Promise<void> | undefined;

  export function reportFailure(error: unknown): void {
    failure = error instanceof Error ? error.message : String(error);
    leaving = false;
  }

  onMount(() => {
    restoration = (async () => {
      try {
        selected = await client.restore();
        if (selected) await openNotes(selected);
      } catch (error) {
        reportFailure(error);
      } finally {
        restoring = false;
      }
    })();
  });

  function openNotes(
    target: VaultDescriptor,
    recovery = readRecovery(target.profileId),
  ): Promise<void> {
    safeMode = recovery;
    failure = "";
    selected = target;
    openingNotes = true;
    const operation = (async () => {
      try {
        session = await openNotesSession(target, metadataOwner, editingOwner);
      } catch (error) {
        await client.close(target);
        selected = null;
        reportFailure(error);
        throw error;
      } finally {
        openingNotes = false;
      }
    })();
    opening = operation.catch(() => undefined);
    return operation;
  }

  function restartNotes(mode: AppSafeModeState): Promise<void> {
    if (restarting) return restarting;
    restarting = (async () => {
      const target = selected;
      if (!target || !notes)
        throw new Error("No Notes session is available to restart");
      await notes.dispose();
      storeRecovery(target.profileId, mode);
      session = null;
      await tick();
      await openNotes(target, mode);
    })().finally(() => {
      restarting = undefined;
    });
    return restarting;
  }

  async function back(): Promise<void> {
    if (selected) storeRecovery(selected.profileId, normalRecovery());
    await client.rememberNotes(null);
    if (selected) await client.close(selected);
    selected = null;
    session = null;
  }

  export async function prepareToLeave(
    mode: "close" | "reload" = "close",
  ): Promise<void> {
    leaving = true;
    failure = "";
    await tick();
    await restoration;
    await opening;
    await tick();
    await client.prepareLeave(mode);
    if (session) {
      if (!notes)
        throw new Error("The workspace is still starting. Please try again.");
      await notes.dispose(mode);
    }
    await client.closeAll(mode);
  }

  export async function openVaults(): Promise<void> {
    if (leaving) return;
    await restoration;
    await opening;
    if (leaving) return;
    if (notes) await notes.openVaults();
  }

  export function canEdit(): boolean {
    if (leaving || restoring || openingNotes) return false;
    return session ? (notes?.canEdit() ?? false) : true;
  }
</script>

<main
  class="shell-content"
  data-tauri-drag-region="deep"
  aria-label="Vault launcher"
  hidden={session !== null}
  inert={leaving}
>
  {#if failure && !session}<DesktopFailure message={failure} />{/if}
  <div class="shell-stage">
    {#if restoring || openingNotes}
      <DesktopWorkspaceStartup
        tasks={[
          {
            id: "restore",
            label: "Restore your notes",
            status: openingNotes ? "complete" : "active",
          },
          {
            id: "storage",
            label: "Open notes storage",
            status: openingNotes ? "active" : "pending",
          },
        ]}
      />
    {:else}
      <VaultLauncher
        {client}
        {returnProfileId}
        onError={reportFailure}
        onOpenNotes={openNotes}
      />
    {/if}
  </div>
</main>
{#if session}
  {#key session}
    <NotesWorkspace
      bind:this={notes}
      {session}
      {urlDelivery}
      {safeMode}
      hostFailure={failure}
      {pluginDistributionOptions}
      pluginAssetServer={createNativePluginAssetServer(
        session.vaultAdapter,
        selected!.resourceToken,
      )}
      createTerminal={(app) => createNativeTerminal(app, selected!)}
      createAi={coreChat
        ? undefined
        : (app, tools) => createAi(app, selected!, tools)}
      nativeChat={coreChat
        ? (app) => createNativeChatHost(app, selected!)
        : undefined}
      createRepository={() => createNativeRepository(selected!)}
      createPopouts={createPopouts
        ? (app) => createPopouts!(app, selected!)
        : undefined}
      onRestart={restartNotes}
      onBack={back}
      onReady={async () => {
        await client.rememberNotes(selected);
        returnProfileId = selected?.profileId ?? null;
      }}
    />
  {/key}
{/if}
