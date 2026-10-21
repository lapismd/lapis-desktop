<script lang="ts">
  import { FileListing } from "@lapismd/design-core/diff";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import { Spinner } from "@lapismd/design-core/shadcn/spinner";
  import { formatRelativeTime } from "@lapismd/design-core/shadcn/relative-time";
  import DownIcon from "@lucide/svelte/icons/chevron-down";
  import RightIcon from "@lucide/svelte/icons/chevron-right";
  import { agentAvatar } from "../../../lib/ai/presentation/agent-avatar.ts";
  import { profileLabel } from "../../../lib/ai/session-browser/model.ts";
  import type { ImportBrowser } from "../../../lib/ai/imports/browser.svelte.ts";
  import type {
    ImportHarness,
    ImportFolder,
    BrowserSession,
  } from "../../../lib/ai/imports/source-port.ts";
  let {
    browser,
    harness,
    selected,
    onSelect,
    available = true,
  }: {
    browser: ImportBrowser;
    harness: { id: ImportHarness; name: string };
    selected?: BrowserSession;
    onSelect: (selector: string) => void;
    available?: boolean;
  } = $props();
  let parents = $state.raw(new Set<string>());
  const index = $derived(browser.indexes[harness.id]);
  const groups = $derived.by(() => {
    const sessions = browser.rows;
    const directories = new Map<string, string>(),
      folders = new Map<string, ImportFolder>(),
      rows = new Map<string, BrowserSession>();
    const counts = new Map<string, number>();
    for (const folder of browser.indexes[harness.id].folders)
      counts.set(folder.label, (counts.get(folder.label) ?? 0) + 1);
    for (const folder of browser.indexes[harness.id].folders) {
      const name =
        (counts.get(folder.label) ?? 0) > 1
          ? `${folder.label} (${folder.selector.slice(0, 6)})`
          : folder.label;
      directories.set(folder.selector, name);
      folders.set(name, folder);
    }
    for (const row of sessions)
      if (row.kind === harness.id && directories.has(row.folder))
        rows.set(`${directories.get(row.folder)}/${row.selector}.jsonl`, row);
    return {
      directories,
      folders,
      rows,
      files: [...rows.keys()].map((path) => ({ path })),
    };
  });
  const path = (row: BrowserSession) => {
    const name = groups.directories.get(row.folder);
    return name ? `${name}/${row.selector}.jsonl` : "";
  };
  function toggle(path: string) {
    const folder = groups.folders.get(path);
    if (folder) {
      browser.toggleFolder(folder.selector, harness.id);
      return;
    }
    const next = new Set(parents);
    const key = path;
    if (next.has(key)) next.delete(key);
    else next.add(key);
    parents = next;
  }
</script>

<div class="harness">
  <Button
    variant="ghost"
    size="sm"
    aria-expanded={browser.expanded.has(harness.id)}
    disabled={!available}
    onclick={() => browser.toggleHarness(harness.id)}
  >
    {#if browser.expanded.has(harness.id)}<DownIcon
        aria-hidden="true"
      />{:else}<RightIcon aria-hidden="true" />{/if}
    <img src={agentAvatar(harness.id)} alt="" /><span>{harness.name}</span
    >{" "}<small
      >{index.loading
        ? "Indexing…"
        : index.loaded
          ? `${index.indexed} sessions`
          : "Local history"}</small
    >
  </Button>
</div>
{#if browser.expanded.has(harness.id)}
  {#if !index.loaded && index.loading}<div
      class="index-loading"
      role="status"
      aria-label={`Finding ${harness.name} folders`}
    >
      <Spinner /><span>Finding project folders…</span><Skeleton
        style="height:1.5rem;width:100%"
      /><Skeleton style="height:1.5rem;width:75%" />
    </div>
  {:else if index.loaded && !index.folders.length}<p class="empty-folder">
      No local sessions found.
    </p>
  {:else if index.folders.length}
    <nav class="folder-tree" aria-label={`${harness.name} project folders`}>
      <FileListing
        virtualize
        virtualEstimateSize={48}
        directories={[...groups.folders.keys()].map((path) => ({ path }))}
        files={groups.files}
        selectedPath={selected?.kind === harness.id ? path(selected) : null}
        collapsedDirectoryPaths={new Set([
          ...index.folders
            .filter((f) => browser.collapsed.has(f.selector))
            .map((f) => groups.directories.get(f.selector)!),
          ...parents,
        ])}
        onDirectoryToggle={(path) => toggle(path)}
        onSelectPath={(file) => {
          const row = groups.rows.get(file);
          if (row) onSelect(row.selector);
        }}
      >
        {#snippet fileLabel({ path: file })}{@const row =
            groups.rows.get(file)!}<span class="session-label"
            ><strong>{row.title}</strong><small
              >{profileLabel(row.profile)} ·
              <time
                datetime={row.updatedAt}
                title={formatRelativeTime(row.updatedAt).full}
                >{formatRelativeTime(row.updatedAt).text}</time
              ></small
            ></span
          >{/snippet}
      </FileListing>
    </nav>
  {/if}
  {#if index.limited}<p class="empty-folder">
      Showing the most recent indexed sessions. Refresh to check again.
    </p>{/if}
{/if}

<style>
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
    padding: 0 0.375rem 0.5rem 1.375rem;
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
  .index-loading {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 0.75rem 1.375rem;
    font-size: 0.75rem;
    color: var(--muted-foreground);
  }
  .empty-folder {
    margin: 0.5rem 1.375rem;
    font-size: 0.75rem;
    color: var(--muted-foreground);
  }
</style>
