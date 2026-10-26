<script lang="ts">
  import { onMount } from "svelte";
  import {
    App,
    MemoryVaultAdapter,
    MemoryAppDatabase,
    installApplicationCompatibility,
  } from "@lapis-notes/api";
  import {
    FileExplorerPlugin,
    FileExplorerViewType,
  } from "@lapis-notes/file-explorer";
  import { BasesPlugin } from "@lapis-notes/bases";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import basesStyles from "@lapis-notes/bases/styles.css?inline";
  import { registerCatalogCleanup } from "../lifecycle";
  import { reviewLayout } from "./layout";

  const database = new MemoryAppDatabase(crypto.randomUUID());
  const app = new App({
    version: "0.1.0",
    configPath: ".lapis/app.json",
    adapter: new MemoryVaultAdapter({
      "Projects.base": "views:\n  - type: table\n    name: Projects\n",
    }),
    appDatabase: database,
    markdownRenderer: async () => {},
  });
  const compatibility = installApplicationCompatibility(app);
  app.plugins.registerStaticPlugins([
    { plugin: FileExplorerPlugin, enabledByDefault: true },
    { plugin: BasesPlugin, enabledByDefault: true, styles: basesStyles },
  ]);
  let ready = $state(false);
  let failure = $state("");
  onMount(() => {
    const boot = (async () => {
      await app.vault.load();
      await app.configuration.load();
      await app.plugins.loadPlugins({ communityPlugins: "disabled" });
      const layout = reviewLayout();
      layout.main.children[0]!.children[0]!.state = {
        type: FileExplorerViewType,
        state: {},
        title: "Files",
        icon: "folder",
      };
      await app.workspace.changeLayout(layout);
      ready = true;
    })();
    void boot.catch((error) => {
      failure = String(error);
    });
    let shutdown: Promise<void> | undefined;
    const close = () =>
      (shutdown ??= (async () => {
        try {
          await boot;
        } finally {
          await app.fileEditingSessions.settleOperations();
          for (const plugin of [...app.plugins.plugins.values()].reverse())
            await plugin.disable();
          await app.workspace.disposeWorkspaceHost();
          await app.fileEditingSessions.dispose();
          await app.metadataCache.dispose();
          await database.close();
          compatibility();
        }
      })());
    const unregister = registerCatalogCleanup(close);
    return () => {
      unregister();
      void close().catch(console.error);
    };
  });
</script>

<div data-file-icons-ready={ready} style="height: 100vh">
  <WorkspaceShell {app} />
  {#if failure}<p role="alert">{failure}</p>{/if}
</div>
