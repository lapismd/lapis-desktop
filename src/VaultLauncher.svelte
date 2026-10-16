<script lang="ts">
  import type { VaultProfile } from "@lapis-notes/api";
  import {
    DesktopVaultLauncher,
    type DesktopVaultLauncherHost,
  } from "@lapis-notes/workspace";
  import type { VaultClient, VaultDescriptor } from "./vault-client.ts";
  import {
    readLauncherAppearance,
    saveLauncherAppearance,
  } from "./launcher-appearance.ts";

  let {
    client,
    errorMessage = "",
    onOpenNotes,
    onError,
  }: {
    client: VaultClient;
    errorMessage?: string;
    onOpenNotes(selected: VaultDescriptor): Promise<void>;
    onError(error: unknown): void;
  } = $props();
  let busy = $state(false);
  const host: DesktopVaultLauncherHost = {
    async listProfiles() {
      return (await client.recents()).map((recent) => ({
        id: recent.id,
        name: recent.name,
        kind: "desktop-folder" as const,
        handle: { rootPath: recent.path },
        createdAt: 0,
        updatedAt: 0,
      }));
    },
    getAppearance: async () => readLauncherAppearance(),
    saveAppearance: async (mode) => saveLauncherAppearance(mode),
  };

  async function choose(
    open: () => Promise<VaultDescriptor | null>,
  ): Promise<void> {
    if (busy) return;
    busy = true;
    try {
      const selected = await open();
      if (selected) await onOpenNotes(selected);
    } catch (error) {
      onError(error);
    } finally {
      busy = false;
    }
  }
</script>

<DesktopVaultLauncher
  {host}
  status={busy ? "opening" : "landing"}
  {errorMessage}
  onCreate={() => choose(() => client.create())}
  onOpen={() => choose(() => client.select())}
  onOpenRecent={(profile: VaultProfile) =>
    choose(() => client.openRecent(profile.id))}
/>
