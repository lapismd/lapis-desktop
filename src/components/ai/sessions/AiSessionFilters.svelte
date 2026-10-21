<!-- SPDX-License-Identifier: Apache-2.0; adapted from jj-store CommunityInboxFilters, 08b58c7e. -->
<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import ListFilterIcon from "@lucide/svelte/icons/list-filter";
  import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
  import XIcon from "@lucide/svelte/icons/x";
  import type { SessionItem } from "../../../lib/ai/session-browser/model.ts";
  let {
    items,
    selected = $bindable([]),
  }: {
    items: readonly SessionItem[];
    selected?: readonly string[];
  } = $props();
  let open = $state(false),
    query = $state("");
  let input = $state<HTMLInputElement | null>(null);
  const count = $derived(selected.length);
  const options = $derived(
    [...new Set([...items.map((item) => item.profile), ...selected])].sort(),
  );
  function toggle(profile: string) {
    selected = selected.includes(profile)
      ? selected.filter((value) => value !== profile)
      : [...selected, profile];
  }
</script>

<Popover.Root
  {open}
  onOpenChange={(next) => {
    open = next;
    if (next) query = "";
  }}
>
  <Popover.Trigger
    >{#snippet child({ props })}<Button
        {...props}
        variant={count ? "default" : "ghost"}
        size="icon-sm"
        aria-label="Filter loaded sessions"
        title="Filter loaded sessions"
        aria-pressed={count > 0}><ListFilterIcon aria-hidden="true" /></Button
      >{/snippet}</Popover.Trigger
  >
  <Popover.Content
    align="end"
    role="dialog"
    aria-label="Session filters"
    style="--ui-popover-width:min(24rem,calc(100vw - 2rem));--ui-popover-padding:0;--ui-popover-gap:0"
    onOpenAutoFocus={(event) => {
      event.preventDefault();
      input?.focus();
    }}
  >
    <CommandView.Root label="Session filters">
      <div class="filter-search">
        <CommandView.Input
          bind:ref={input}
          bind:value={query}
          placeholder="Find filters..."
          aria-label="Find session filters"
        />
        <Popover.Close>
          {#snippet child({ props })}<Button
              {...props}
              variant="ghost"
              size="icon-sm"
              aria-label="Close filters"><XIcon aria-hidden="true" /></Button
            >{/snippet}
        </Popover.Close>
      </div>
      <CommandView.List>
        <CommandView.Empty>No matching filters</CommandView.Empty>
        <CommandView.Group heading="Source">
          {#each options as option (option)}
            <CommandView.Item
              value={option}
              aria-label={`Source: ${option}`}
              data-checked={selected.includes(option) ? "" : undefined}
              onSelect={() => toggle(option)}
            >
              <CommandView.ItemLabel>{option}</CommandView.ItemLabel>
              {#if selected.includes(option)}<span
                  data-ui-component="command-view"
                  data-ui-part="trailing"
                  ><CircleCheckIcon
                    fill="var(--foreground)"
                    stroke="var(--background)"
                    aria-label="Selected"
                  /></span
                >{/if}
            </CommandView.Item>
          {/each}
        </CommandView.Group>
      </CommandView.List>
      <CommandView.Footer>
        <Button
          variant="ghost"
          size="sm"
          disabled={!count}
          onclick={() => (selected = [])}>Clear filters</Button
        >
      </CommandView.Footer>
    </CommandView.Root>
  </Popover.Content>
</Popover.Root>

<style>
  .filter-search {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.5rem;
    border-bottom: 1px solid var(--border);
    --ui-command-view-border-color: transparent;
  }
</style>
