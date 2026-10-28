<script lang="ts">
  import { onMount, tick, untrack } from "svelte";
  import { registerCatalogCleanup } from "../lifecycle.ts";
  import {
    App,
    MemoryAppDatabase,
    MemoryVaultAdapter,
    provideApplicationState,
  } from "@lapis-notes/api";
  import { MarkdownPlugin } from "@lapis-notes/markdown";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
  import { bindHostLifecycleFailure } from "../../../src/lib/desktop/host-lifecycle-failure.ts";

  const failure =
    "Could not finish closing storage. Your session remains available.";
  const adapter = new MemoryVaultAdapter({
    "Note.md": "# Host lifecycle note\n",
    ".lapis/app.json": "{}",
  });
  const database = new MemoryAppDatabase("desktop-host-lifecycle");
  const app = untrack(
    () =>
      new App({
        version: "0.0.0-story",
        adapter,
        appDatabase: database,
        workspaceShell: { notifications: true },
        markdownRenderer: async () => {},
      }),
  );
  provideApplicationState(app);
  app.plugins.registerCorePlugins([
    { plugin: MarkdownPlugin, required: false, enabledByDefault: true },
  ]);
  const lifecycle = bindHostLifecycleFailure(app);
  let ready = $state(false);
  onMount(() => {
    let active = true;
    const startup = (async () => {
      await app.vault.load();
      await app.configuration.load();
      await app.plugins.loadPlugins({
        communityPlugins: "disabled",
        optionalCorePlugins: "configured",
      });
      await app.workspace.loadLayout();
      const { controller } = getWorkspaceHostBinding(app.workspace);
      await controller.start();
      if (!active) return;
      ready = true;
      await tick();
      await tick();
      if (active) lifecycle.publish(failure);
    })();
    let closing: Promise<void> | undefined;
    const dispose = () =>
      (closing ??= (async () => {
        active = false;
        await startup;
        lifecycle.dispose();
        await app.plugins.flushPendingConfigWrites();
        await app.fileEditingSessions.settleOperations();
        await app.fileEditingSessions.guard(undefined, async () => {
          await app.workspace.flushLayout();
          await app.workspace.disposeWorkspaceHost();
          await app.plugins.unloadPlugin("markdown");
        });
        await app.fileEditingSessions.dispose();
        await database.close();
      })());
    const stopCleanup = registerCatalogCleanup(dispose);
    return () => {
      stopCleanup();
      void dispose().catch((error) =>
        console.error("Host lifecycle catalog teardown failed", error),
      );
    };
  });
</script>

<div class="host-lifecycle-demo" data-host-lifecycle-ready={ready}>
  {#if ready}<WorkspaceShell {app} />{/if}
</div>

<style>
  .host-lifecycle-demo {
    width: 100%;
    height: 100dvh;
    min-height: 0;
  }
</style>
