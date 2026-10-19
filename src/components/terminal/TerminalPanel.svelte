<!-- Terminal presentation adapted from lapis-plugin-terminal; AGPL-3.0-or-later. -->
<script lang="ts">
  import { untrack } from "svelte";
  import { TerminalViewport } from "@lapismd/terminal/svelte";
  import { terminalPalette } from "@lapismd/terminal";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { WorkspaceIcon } from "@lapismd/design-core/workspace/icon";
  import type {
    TerminalTab,
    TerminalTabState,
  } from "../../lib/terminal/terminal-tab.ts";

  let { tab }: { tab: TerminalTab } = $props();
  let snapshot = $state<TerminalTabState>(untrack(() => tab.state));
  let dark = $state(false);
  let exited = $state(false);
  $effect(() => tab.subscribe((value) => (snapshot = value)));
  $effect(() => {
    const session = snapshot.session;
    return session?.subscribe((value) => (exited = value.info.exited));
  });
  $effect(() => {
    const root = document.documentElement;
    const update = () => (dark = root.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  });
</script>

<section
  class="terminal-panel"
  aria-label="Terminal"
  aria-busy={snapshot.busy}
  data-session-id={snapshot.session?.id}
>
  {#if snapshot.session}
    {#if exited}<p role="status">
        Shell exited. Open a new terminal to start another session.
      </p>{/if}
    <div class="terminal-surface">
      <TerminalViewport
        session={snapshot.session}
        palette={terminalPalette(dark)}
      />
    </div>
  {:else}
    <Empty.Root>
      <Empty.Header>
        <Empty.Media variant="icon"
          ><WorkspaceIcon name="square-terminal" /></Empty.Media
        >
        <Empty.Title role="heading" aria-level={2}
          >{snapshot.error
            ? "Unable to start terminal"
            : "Terminal"}</Empty.Title
        >
        <Empty.Description
          >{snapshot.error ??
            "This restored tab has no running shell. Choose Start to launch a new shell in this vault."}</Empty.Description
        >
      </Empty.Header>
      <Empty.Content>
        <Button disabled={snapshot.busy} onclick={() => void tab.start()}
          >{snapshot.busy ? "Starting…" : "Start"}</Button
        >
      </Empty.Content>
    </Empty.Root>
  {/if}
</section>

<style>
  .terminal-panel {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    height: 100%;
    min-height: 0;
    color: var(--ui-workspace-view-foreground);
    background: var(--ui-workspace-view-background);
  }
  .terminal-surface {
    flex: 1;
    min-height: 0;
    min-width: 0;
  }
  p {
    margin: 0;
    padding: 0.5rem;
  }
</style>
