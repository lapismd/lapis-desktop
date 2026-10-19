<!-- SPDX-License-Identifier: Apache-2.0; adapted from jj-store 08b58c7e, see docs/provenance.json. -->
<script lang="ts">
  // Width fitting follows CommunityProjectsRepositoryDocuments; presentation is opt-in.
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import * as Tabs from "@lapismd/design-core/shadcn/tabs";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import { onMount, untrack } from "svelte";
  import type { Component, Snippet } from "svelte";
  import "./session-tabs.css";
  let {
    value,
    sections,
    onSelect,
    label = "Repository sections",
    navigationLabel,
    disabled = false,
    leading,
    trailing,
    hideTabs = false,
  }: {
    value: string;
    sections: readonly {
      value: string;
      label: string;
      disabled?: boolean;
      Icon?: Component;
    }[];
    onSelect(value: string): void;
    label?: string;
    navigationLabel?: string;
    disabled?: boolean;
    leading?: Snippet;
    trailing?: Snippet;
    hideTabs?: boolean;
  } = $props();
  let space: HTMLElement | null = $state(null);
  let tabList: HTMLElement | null = $state(null);
  let visibleCount = $state(untrack(() => sections.length));
  let mounted = $state(false);
  let probeList: HTMLElement | null = $state(null);
  let probeMore: HTMLButtonElement | null = $state(null);
  const visible = $derived(sections.slice(0, visibleCount));
  const overflow = $derived(sections.slice(visibleCount));
  const overflowActive = $derived(
    overflow.some((item) => item.value === value),
  );
  function select(next: string | undefined) {
    if (
      !disabled &&
      next !== value &&
      sections.some((item) => item.value === next && !item.disabled)
    )
      onSelect(next!);
  }
  function fitTabs() {
    if (!mounted || !space || !probeList || !probeMore) return;
    const widths = [
      ...probeList.querySelectorAll<HTMLElement>(
        ".ai-session-tabs__tab-trigger",
      ),
    ].map((tab) => tab.getBoundingClientRect().width);
    if (widths.length !== sections.length) return;
    const gap = parseFloat(getComputedStyle(space).gap) || 0;
    const total =
      widths.reduce((sum, width) => sum + width, 0) +
      gap * Math.max(0, widths.length - 1);
    if (total <= space.clientWidth + 1) {
      visibleCount = sections.length;
      return;
    }
    const available =
      space.clientWidth - probeMore.getBoundingClientRect().width - gap;
    let used = 0,
      count = 0;
    for (const width of widths) {
      const next = used + width + (count ? gap : 0);
      if (next > available + 1) break;
      used = next;
      count += 1;
    }
    visibleCount = count;
  }
  $effect(() => {
    sections;
    probeList;
    probeMore;
    hideTabs;
    untrack(fitTabs);
  });
  $effect(() => {
    const element = space;
    const probe = probeList;
    if (!mounted || !element || !probe) return;
    let frame: number | undefined;
    const observer = new ResizeObserver(() => {
      frame ??= requestAnimationFrame(() => {
        frame = undefined;
        fitTabs();
      });
    });
    observer.observe(element);
    observer.observe(probe);
    untrack(fitTabs);
    return () => {
      observer.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  });
  onMount(() => {
    mounted = true;
    return () => {
      mounted = false;
    };
  });
</script>

{#snippet controls()}
  <div class="ai-session-tabs__tab-measure" aria-hidden="true" inert>
    <Tabs.Root {value} class="ai-session-tabs__tab-probes">
      <Tabs.List
        bind:ref={probeList}
        variant="default"
        class="ai-session-tabs__tab-list"
      >
        {#each sections as item (item.value)}
          <Tabs.Trigger
            class="ai-session-tabs__tab-trigger"
            value={item.value}
            disabled
            >{#if item.Icon}<item.Icon
                data-icon="inline-start"
                aria-hidden="true"
              />{/if}{item.label}</Tabs.Trigger
          >
        {/each}
      </Tabs.List>
      <Button
        bind:ref={probeMore}
        variant="ghost"
        size="sm"
        class="ai-session-tabs__tab-more"
        disabled
      >
        More<ChevronDownIcon data-icon="inline-end" aria-hidden="true" />
      </Button>
    </Tabs.Root>
  </div>
  {@render leading?.()}
  {#if !hideTabs && sections.length}
    <div class="ai-session-tabs__tab-space" bind:this={space}>
      <Tabs.List
        bind:ref={tabList}
        variant="default"
        class="ai-session-tabs__tab-list"
        aria-label={label}
        data-empty={visibleCount === 0 ? "" : undefined}
        aria-hidden={visibleCount === 0 ? "true" : undefined}
      >
        {#each visible as item (item.value)}
          <Tabs.Trigger
            class="ai-session-tabs__tab-trigger"
            value={item.value}
            disabled={disabled || item.disabled}
            title={item.label}
            >{#if item.Icon}<item.Icon
                data-icon="inline-start"
                aria-hidden="true"
              />{/if}{item.label}</Tabs.Trigger
          >
        {/each}
      </Tabs.List>
      {#if overflow.length}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Button
                {...props}
                variant="ghost"
                size="sm"
                class="ai-session-tabs__tab-more"
                {disabled}
                aria-label={`More ${label.toLowerCase()}`}
                aria-current={overflowActive ? "page" : undefined}
                data-selected={overflowActive ? "" : undefined}
              >
                More<ChevronDownIcon
                  data-icon="inline-end"
                  aria-hidden="true"
                />
              </Button>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            align="start"
            sideOffset={4}
            preventScroll={false}
            aria-label={`More ${label.toLowerCase()}`}
          >
            <DropdownMenu.Group>
              {#each overflow as item (item.value)}
                <DropdownMenu.Item
                  disabled={item.disabled}
                  aria-current={value === item.value ? "page" : undefined}
                  onSelect={() => select(item.value)}
                  >{#if item.Icon}<item.Icon
                      aria-hidden="true"
                    />{/if}{item.label}</DropdownMenu.Item
                >
              {/each}
            </DropdownMenu.Group>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      {/if}
    </div>
  {/if}
  {@render trailing?.()}
{/snippet}

<div
  class="ai-session-tabs__tabs"
  data-presentation="pill"
  role={navigationLabel ? "navigation" : undefined}
  aria-label={navigationLabel}
>
  <Tabs.Root {value} onValueChange={select} class="ai-session-tabs__tab-root"
    >{@render controls()}</Tabs.Root
  >
</div>
