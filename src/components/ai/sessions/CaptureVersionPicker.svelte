<!-- SPDX-License-Identifier: Apache-2.0; Notes repository Command View pattern. -->
<script lang="ts">
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { formatRelativeTime } from "@lapismd/design-core/shadcn/relative-time";
  import HistoryIcon from "@lucide/svelte/icons/history";
  import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
  import XIcon from "@lucide/svelte/icons/x";
  import type { SavedSessionVersion } from "../../../lib/ai/session-browser/model.ts";
  let {
    versions,
    selected,
    onSelect,
  }: {
    versions: SavedSessionVersion[];
    selected?: string;
    onSelect: (id: string) => void;
  } = $props();
  let open = $state(false),
    query = $state("");
  let input = $state<HTMLInputElement | null>(null);
  const current = $derived(versions.find((v) => v.id === selected));
  const visible = $derived(
    versions.filter((v) =>
      `version ${v.sequence} ${v.incomplete ? "incomplete" : "saved"}`.includes(
        query.toLowerCase(),
      ),
    ),
  );
</script>

<Popover.Root bind:open onOpenChange={() => (query = "")}>
  <Popover.Trigger
    >{#snippet child({ props })}<Button
        {...props}
        variant="ghost"
        size="xs"
        aria-label={`Choose captured version ${current?.sequence ?? ""}`}
        ><HistoryIcon data-icon="inline-start" aria-hidden="true" />Version {current?.sequence ??
          "—"}</Button
      >{/snippet}</Popover.Trigger
  >
  <Popover.Content
    side="top"
    align="start"
    role="dialog"
    aria-label="Captured versions"
    style="--ui-popover-width:min(26rem,calc(100vw - 2rem));--ui-popover-padding:0;--ui-popover-gap:0"
    onOpenAutoFocus={(e) => {
      e.preventDefault();
      input?.focus();
    }}
  >
    <CommandView.Root label="Captured versions" shouldFilter={false}>
      <div class="version-search">
        <CommandView.Input
          bind:ref={input}
          bind:value={query}
          placeholder="Find version"
          aria-label="Find version"
        />
        <Popover.Close
          >{#snippet child({ props })}<Button
              {...props}
              variant="ghost"
              size="icon-sm"
              aria-label="Close version picker"
              ><XIcon aria-hidden="true" /></Button
            >{/snippet}</Popover.Close
        >
      </div>
      <CommandView.List>
        <CommandView.Empty>No matching versions</CommandView.Empty>
        <CommandView.Group>
          {#each visible as version (version.id)}
            <CommandView.Item
              value={version.id}
              aria-label={`Preview version ${version.sequence}${version.incomplete ? " (incomplete)" : ""}`}
              onSelect={() => {
                open = false;
                onSelect(version.id);
              }}
            >
              <span class="version-row"
                ><span class="version-selected"
                  >{#if version.id === selected}<CircleCheckIcon
                      fill="var(--foreground)"
                      stroke="var(--background)"
                      aria-hidden="true"
                    />{/if}</span
                ><span class="version-name">Version {version.sequence}</span
                ><span>{version.incomplete ? "Incomplete" : "Saved"}</span><time
                  datetime={version.updatedAt}
                  >{formatRelativeTime(Date.parse(version.updatedAt))
                    .text}</time
                ></span
              >
            </CommandView.Item>
          {/each}
        </CommandView.Group>
      </CommandView.List>
    </CommandView.Root>
  </Popover.Content>
</Popover.Root>

<style>
  .version-search {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.5rem;
    border-bottom: 1px solid var(--border);
    --ui-command-view-border-color: transparent;
  }
  .version-row {
    display: flex;
    min-width: 0;
    width: 100%;
    align-items: center;
    gap: 0.5rem;
  }
  .version-selected {
    display: flex;
    width: 1rem;
    flex: none;
  }
  .version-selected :global(svg) {
    width: 1rem;
    height: 1rem;
  }
  .version-name {
    min-width: 0;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  time,
  .version-row > span:nth-last-child(2) {
    flex: none;
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }
</style>
