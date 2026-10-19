<!-- SPDX-License-Identifier: Apache-2.0; CommunityInbox port, jj-store 08b58c7e. -->
<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import { AppShell } from "@lapismd/design-core/shell";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import ArrowIcon from "@lucide/svelte/icons/arrow-right";
  import AiSessionFrame from "./AiSessionFrame.svelte";
  import AiSessionThread from "./AiSessionThread.svelte";
  import AiSessionSearch from "./AiSessionSearch.svelte";
  import AiSessionFilters from "./AiSessionFilters.svelte";
  import AiSessionTabs from "./AiSessionTabs.svelte";
  import AiSessionList from "./AiSessionList.svelte";
  import { createSessionResize } from "./session-resize.svelte.ts";
  import type { SessionItem } from "../../../lib/ai/session-browser/model.ts";
  import "./session-shell.css";
  let {
    items,
    activeId,
    title,
    status,
    label,
    action = "Open",
    loading = false,
    busy = false,
    emptyTitle,
    emptyDescription,
    onSelect,
    actions,
    listActions,
    listFooter,
    footer,
    children,
    toolInspector,
    harness = "codex",
    showMainOnCompact = false,
  }: {
    items: SessionItem[];
    activeId?: string;
    title: string;
    status?: string;
    label: string;
    action?: string;
    loading?: boolean;
    busy?: boolean;
    emptyTitle: string;
    emptyDescription: string;
    onSelect: (id: string) => void;
    actions?: Snippet;
    listActions?: Snippet;
    listFooter?: Snippet;
    footer?: Snippet;
    children: Snippet;
    toolInspector?: Snippet;
    harness?: string;
    /** Live chat keeps its composer reachable even before a conversation has an id. */
    showMainOnCompact?: boolean;
  } = $props();
  const panelId = $props.id();
  let body = $state<HTMLElement | null>(null),
    list = $state<HTMLElement | null>(null);
  let height = $state(0),
    width = $state(0),
    listOpen = $state(true);
  let query = $state(""),
    searchOpen = $state(false),
    selectedProfiles = $state<readonly string[]>([]);
  const resize = createSessionResize(
    () => body,
    () => list,
  );
  const sections = [{ value: "all", label: "All" }];
  const visible = $derived(
    items.filter(
      (item) =>
        (!selectedProfiles.length || selectedProfiles.includes(item.profile)) &&
        `${item.title} ${item.profile} ${item.path ?? ""}`
          .toLocaleLowerCase()
          .includes(query.trim().toLocaleLowerCase()),
    ),
  );
  const compact = $derived(width > 0 && width < 640);
  $effect(() => {
    if ((activeId || showMainOnCompact) && compact)
      untrack(() => {
        listOpen = false;
      });
  });
  $effect(() => {
    if (!compact) listOpen = true;
  });
</script>

<AiSessionFrame
  {label}
  contentLabel="Selected session"
  bind:body
  bind:height
  bind:width
  contentHidden={compact && listOpen}
  {toolInspector}
>
  {#snippet navigation()}
    <AppShell.Body.Sidebar
      bind:ref={list}
      side="left"
      {panelId}
      {label}
      bind:open={listOpen}
      class="ai-session-list-region"
      style={`--ui-shell-body-sidebar-width:${compact ? "100%" : resize.width === undefined ? "min(23rem, 38%)" : `${resize.width}px`}`}
    >
      <div class="ai-session-list" style={`height:${height}px`}>
        <header aria-label={`${label} navigation`}>
          <AiSessionTabs
            value="all"
            {sections}
            onSelect={() => {}}
            label="Session views"
            hideTabs={searchOpen}
          >
            {#snippet leading()}<AiSessionSearch
                label={`Search ${label.toLowerCase()}`}
                scope={label}
                {query}
                bind:open={searchOpen}
                live
                onQuery={(next) => {
                  query = next;
                }}
              />{/snippet}
            {#snippet trailing()}<AiSessionFilters
                {items}
                bind:selected={selectedProfiles}
              />{@render listActions?.()}
              {#if compact}<Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Show selected session"
                  onclick={() => (listOpen = false)}
                  ><ArrowIcon aria-hidden="true" /></Button
                >{/if}
            {/snippet}
          </AiSessionTabs>
        </header>
        <ScrollArea class="ai-session-list-scroll">
          <AiSessionList
            items={visible}
            {activeId}
            {loading}
            {busy}
            {label}
            {action}
            emptyTitle={query || selectedProfiles.length > 0
              ? "No matching sessions"
              : emptyTitle}
            emptyDescription={query || selectedProfiles.length > 0
              ? "Try another search or source filter."
              : emptyDescription}
            onSelect={(id) => {
              if (compact && id === activeId) listOpen = false;
              onSelect(id);
            }}
          />
        </ScrollArea>
        {@render listFooter?.()}
      </div>
    </AppShell.Body.Sidebar>
    {#if listOpen && !compact}
      <button
        type="button"
        class="ai-session-resize"
        data-resizing={resize.resizing || undefined}
        aria-label={`Resize ${label.toLowerCase()}`}
        title="Drag to resize. Double-click to reset width."
        onpointerdown={resize.begin}
        onpointermove={resize.move}
        onpointerup={resize.finish}
        onpointercancel={resize.finish}
        ondblclick={resize.reset}
        onkeydown={resize.key}><span aria-hidden="true"></span></button
      >
    {/if}
  {/snippet}
  <AiSessionThread
    {height}
    {harness}
    {title}
    {status}
    selected={!!activeId}
    listLabel={label}
    expanded={listOpen}
    onToggle={() => (listOpen = !listOpen)}
    {actions}
    {footer}
  >
    {@render children()}
  </AiSessionThread>
</AiSessionFrame>
