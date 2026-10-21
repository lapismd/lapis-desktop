<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { AppShell } from "@lapismd/design-core/workspace/app-shell";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { createSettingsFixture } from "./settings-fixture.ts";
  let { running = false }: { running?: boolean } = $props();
  const fixture = untrack(() =>
    createSettingsFixture(running ? "setup-running" : "setup-downloaded"),
  );
  const controller = fixture.controller;
  let ready = $state(false);
  let settingsOpen = $state(false);
  onMount(() => {
    let closed = false;
    void fixture.ready.then(async () => {
      await fixture.plugin.compute?.refresh();
      if (!closed) ready = true;
    });
    return () => {
      closed = true;
      void fixture.close();
    };
  });
</script>

<div class="demo">
  {#if ready}<AppShell.Root {controller}>
      <div class="shell">
        <main>
          <h1>Local compute</h1>
          <p>
            Start a downloaded model in Settings, then stop it from the
            workspace footer.
          </p>
          <Button variant="outline" onclick={() => (settingsOpen = true)}
            >Open compute settings</Button
          >
        </main>
        <AppShell.StatusBar />
      </div>
      <AppShell.SettingsDialog bind:open={settingsOpen} />
    </AppShell.Root>{/if}
</div>

<style>
  .demo {
    height: 100vh;
  }
  .shell {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 0;
  }
  main {
    flex: 1;
    padding: 1.5rem;
    overflow: auto;
  }
  h1 {
    font-size: 1rem;
  }
  p {
    color: var(--muted-foreground);
    font-size: 0.875rem;
  }
</style>
