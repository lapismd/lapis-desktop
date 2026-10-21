<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import { Spinner } from "@lapismd/design-core/shadcn/spinner";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import RightIcon from "@lucide/svelte/icons/chevron-right";
  import RefreshIcon from "@lucide/svelte/icons/refresh-cw";
  import {
    importHarnesses,
    type ImportBrowser,
  } from "../../../lib/ai/imports/browser.svelte.ts";
  import type { BrowserSession } from "../../../lib/ai/imports/source-port.ts";
  import AiImportHarness from "./AiImportHarness.svelte";
  let {
    browser,
    selected,
    onSelect,
    onClose,
    available = true,
  }: {
    browser: ImportBrowser;
    selected?: BrowserSession;
    onSelect: (selector: string) => void;
    onClose?: () => void;
    available?: boolean;
  } = $props();
</script>

<section class="sources" aria-label="Import sources">
  <header>
    <strong>Import sources</strong>
    <div>
      <Tooltip.Provider
        ><Tooltip.Root
          ><Tooltip.Trigger
            >{#snippet child({ props })}<Button
                {...props}
                variant="ghost"
                size="icon-sm"
                aria-label="Refresh sources"
                disabled={!available}
                onclick={() => {
                  for (const harness of importHarnesses)
                    if (browser.expanded.has(harness.id))
                      void browser.loadHarness(harness.id, true);
                }}><RefreshIcon aria-hidden="true" /></Button
              >{/snippet}</Tooltip.Trigger
          ><Tooltip.Content>Refresh sources</Tooltip.Content></Tooltip.Root
        ></Tooltip.Provider
      >
      {#if onClose}<Button
          variant="ghost"
          size="icon-sm"
          aria-label="Show preview"
          onclick={onClose}><RightIcon aria-hidden="true" /></Button
        >{/if}
    </div>
  </header>
  <ScrollArea class="source-scroll">
    {#each importHarnesses as harness}<AiImportHarness
        {browser}
        {harness}
        {selected}
        {onSelect}
        {available}
      />{/each}
  </ScrollArea>
  {#if browser.folder && browser.cache[browser.folder.selector]?.next}<Button
      variant="ghost"
      size="sm"
      disabled={browser.loadingFolder}
      onclick={() => browser.more()}>Load more sessions</Button
    >{/if}
  <footer aria-live="polite">
    {#if browser.loadingFolder}<Spinner /><span
        >{browser.folder && browser.cache[browser.folder.selector]
          ? "Checking cached sessions…"
          : "Loading folder sessions…"}</span
      >
    {:else if browser.folder}<span
        >{browser.cache[browser.folder.selector]?.rows.length ?? 0} sessions · Cached</span
      >
    {:else}<span>Choose a project folder</span>{/if}
  </footer>
  {#if browser.folder && !browser.loadingFolder && browser.cache[browser.folder.selector]?.rows.length === 0}<p
      class="empty-folder"
    >
      No sessions in this folder.
    </p>{/if}
</section>

<style>
  .sources {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
  header {
    display: flex;
    flex: none;
    height: 3.25rem;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0 0.75rem;
  }
  header strong {
    font-size: 0.8125rem;
  }
  header > div {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  .sources :global(.source-scroll) {
    flex: 1;
    min-height: 0;
  }
  footer {
    display: flex;
    flex: none;
    height: 2rem;
    gap: 0.375rem;
    align-items: center;
    padding: 0 0.75rem;
    border-top: 1px solid var(--border);
    font-size: 0.6875rem;
    color: var(--muted-foreground);
  }
  .empty-folder {
    margin: 0.5rem 1.375rem;
    font-size: 0.75rem;
    color: var(--muted-foreground);
  }
</style>
