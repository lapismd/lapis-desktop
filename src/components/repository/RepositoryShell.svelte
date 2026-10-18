<script lang="ts">
  import "./repository-column-chrome.css";
  import "./repository-review-identifiers.css";
  import "./repository-picker-options.css";
  import { onDestroy, type Snippet } from "svelte";
  import { AppShell, AppShellController } from "@lapismd/design-core/shell";
  let { children, surface }: { children: Snippet; surface?: Snippet } =
    $props();
  const shell = new AppShellController();
  onDestroy(() => void shell.dispose());
</script>

<div class="repository-shell">
  <AppShell.Root controller={shell} displayMode="desktop">
    <AppShell.Main>
      <AppShell.Body layout="regions" element="div">
        <div class="repository-body-frame">{@render children()}</div>
      </AppShell.Body>
    </AppShell.Main>
    {@render surface?.()}
  </AppShell.Root>
</div>

<style>
  .repository-shell {
    height: 100%;
    min-width: 0;
    min-height: 0;
    --ui-shell-height: 100%;
  }
  .repository-body-frame {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 0;
    min-height: 0;
    flex: 1;
    overflow: hidden;
  }
</style>
