<script lang="ts">
  import { FileListing } from "@lapismd/design-core/diff";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import { Spinner } from "@lapismd/design-core/shadcn/spinner";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import RefreshIcon from "@lucide/svelte/icons/refresh-cw";
  import codex from "../../../../src/lib/ai/presentation/assets/codex.svg";
  import cursor from "../../../../src/lib/ai/presentation/assets/cursor.svg";
  import opencode from "../../../../src/lib/ai/presentation/assets/opencode.svg";
  import type { ImportBrowserReview } from "./browser.svelte.ts";
  import { folders, sessionPath, type Session } from "./data.ts";
  let {
    browser,
    onSelect,
    onClose,
  }: {
    browser: ImportBrowserReview;
    onSelect(session: Session): void;
    onClose?: () => void;
  } = $props();
</script>

<section class="sources" aria-label="Import sources">
  <header>
    <strong>Import sources</strong><Tooltip.Provider
      ><Tooltip.Root
        ><Tooltip.Trigger>
          {#snippet child({ props })}<Button
              {...props}
              variant="ghost"
              size="icon-sm"
              aria-label="Refresh selected folder"
              disabled={!browser.folder || browser.folderLoading}
              onclick={() => browser.loadFolder()}
              ><RefreshIcon aria-hidden="true" /></Button
            >{/snippet}
        </Tooltip.Trigger><Tooltip.Content
          >Refresh selected folder</Tooltip.Content
        ></Tooltip.Root
      ></Tooltip.Provider
    >{#if onClose}<Button
        variant="ghost"
        size="icon-sm"
        aria-label="Show preview"
        onclick={onClose}><ChevronRightIcon aria-hidden="true" /></Button
      >{/if}
  </header>
  <ScrollArea class="source-scroll">
    <div class="harness">
      <Button
        variant="ghost"
        size="sm"
        aria-expanded={browser.expanded}
        onclick={() => (browser.expanded = !browser.expanded)}
      >
        {#if browser.expanded}<ChevronDownIcon
            aria-hidden="true"
          />{:else}<ChevronRightIcon aria-hidden="true" />{/if}<img
          src={codex}
          alt=""
        /><span>Codex</span>{" "}<small>CLI & Desktop</small>
      </Button>
    </div>
    {#if browser.expanded}
      {#if browser.indexing}<div
          class="source-loading"
          role="status"
          aria-label="Finding project folders"
        >
          <Spinner /><span>Finding project folders…</span><Skeleton
            style="height:1.5rem;width:100%"
          /><Skeleton style="height:1.5rem;width:75%" />
        </div>
      {:else}<nav class="folder-tree" aria-label="Codex project folders">
          <FileListing
            directories={folders.map((folder) => ({ path: folder.path }))}
            files={browser.files.map((session) => ({
              path: sessionPath(session),
            }))}
            selectedPath={browser.selected
              ? sessionPath(browser.selected)
              : null}
            collapsedDirectoryPaths={browser.collapsed}
            onDirectoryToggle={(path) => browser.toggle(path)}
            onSelectPath={(path) => {
              const session = browser.files.find(
                (row) => sessionPath(row) === path,
              );
              if (session) onSelect(session);
            }}
          >
            {#snippet fileLabel({ path })}{@const session = browser.files.find(
                (row) => sessionPath(row) === path,
              )!}<span class="session-label"
                ><strong>{session.title}</strong><small
                  >{session.source} · {session.updated}</small
                ></span
              >{/snippet}
          </FileListing>
        </nav>{/if}
    {/if}
    {#each [{ name: "Cursor", image: cursor }, { name: "OpenCode", image: opencode }] as harness}
      <div class="harness">
        <Button variant="ghost" size="sm" disabled
          ><ChevronRightIcon aria-hidden="true" /><img
            src={harness.image}
            alt=""
          /><span>{harness.name}</span>{" "}<small>Not available</small></Button
        >
      </div>
    {/each}
  </ScrollArea>
  <footer aria-live="polite">
    {#if browser.folderLoading}<Spinner /><span
        >{browser.folder in browser.cache
          ? "Checking cached sessions…"
          : "Loading folder sessions…"}</span
      >
    {:else if browser.folder}<span
        >{browser.cache[browser.folder]?.length ?? 0} sessions · Cached</span
      >
    {:else}<span>Choose a project folder</span>{/if}
  </footer>
  {#if browser.folder && !browser.folderLoading && browser.cache[browser.folder]?.length === 0}<p
      class="folder-empty"
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
  .sources :global(.source-scroll) {
    flex: 1;
    min-height: 0;
  }
  .harness {
    display: flex;
    padding: 0.25rem 0.375rem;
  }
  .harness :global(button) {
    width: 100%;
    justify-content: flex-start;
    gap: 0.5rem;
  }
  img {
    width: 1rem;
    height: 1rem;
    flex: none;
  }
  .harness small {
    margin-inline-start: auto;
  }
  small {
    font-size: 0.6875rem;
    color: var(--muted-foreground);
  }
  .folder-tree {
    padding: 0 0.375rem 0.5rem;
    padding-inline-start: 1.375rem;
  }
  .session-label {
    display: flex;
    min-width: 0;
    flex-direction: column;
    align-items: flex-start;
    padding-block: 0.25rem;
    gap: 0.125rem;
  }
  .session-label strong {
    font-size: 0.75rem;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
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
  .source-loading {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 0.75rem;
    font-size: 0.75rem;
    color: var(--muted-foreground);
  }
  .folder-empty {
    margin: 0.5rem 0.75rem;
    font-size: 0.75rem;
    color: var(--muted-foreground);
  }
</style>
