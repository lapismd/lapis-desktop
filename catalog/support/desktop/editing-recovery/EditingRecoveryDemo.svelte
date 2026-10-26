<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { registerCatalogCleanup } from "../../lifecycle.ts";
  import {
    App,
    MemoryAppDatabase,
    MemoryVaultAdapter,
    provideApplicationState,
  } from "@lapis-notes/api";
  import { MarkdownPlugin } from "@lapis-notes/markdown";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
  import { editingRecoveryPort } from "./port";

  let { scenario = "detached" }: { scenario?: "detached" | "admission" } =
    $props();
  const selected = untrack(() => scenario);
  const saved =
    "# Saved note\n\nThis is the saved file, not an unsaved draft.\n";
  const adapter = new MemoryVaultAdapter({
    "Note.md": saved,
    ".lapis/app.json": "{}",
  });
  const database = new MemoryAppDatabase(`desktop-editing-${selected}`);
  const app = new App({
    version: "0.0.0-story",
    adapter,
    appDatabase: database,
    nativeEditingIntents: editingRecoveryPort(adapter, selected),
    markdownRenderer: async () => {},
  });
  provideApplicationState(app);
  app.plugins.registerCorePlugins([
    { plugin: MarkdownPlugin, required: false, enabledByDefault: true },
  ]);
  let ready = $state(false);
  let frame = $state<HTMLDivElement>();
  $effect(() => {
    if (!frame) return;
    const element = frame as HTMLDivElement & { __lapisApp?: App };
    element.__lapisApp = app;
    return () => {
      delete element.__lapisApp;
    };
  });
  onMount(() => {
    let active = true;
    let unregister = () => {};
    const startup = (async () => {
      await app.vault.load();
      await app.configuration.load();
      await app.plugins.loadPlugins({
        communityPlugins: "disabled",
        optionalCorePlugins: "configured",
      });
      await app.workspace.loadLayout();
      if (selected === "admission") {
        const registration = app.fileEditingSessions.register("Note.md", {
          native: { hold: () => () => {}, savedText: () => saved },
          dirty: false,
          flush: async () => {},
          protect: async () => () => {},
        });
        unregister = registration;
        await registration.ready().catch(() => {});
      }
      const { controller } = getWorkspaceHostBinding(app.workspace);
      await controller.start();
      await controller.commands.execute("app-shell:show-problems");
      if (active) ready = true;
    })();
    let closing: Promise<void> | undefined;
    const dispose = () =>
      (closing ??= (async () => {
        active = false;
        await startup;
        unregister();
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
        console.error("Editing recovery catalog teardown failed", error),
      );
    };
  });
</script>

<div
  bind:this={frame}
  class="editing-recovery-demo"
  data-editing-recovery-ready={ready}
>
  {#if ready}<WorkspaceShell {app} />{/if}
</div>

<style>
  .editing-recovery-demo {
    width: 100%;
    height: 100dvh;
    min-height: 0;
  }
</style>
