<!-- SPDX-License-Identifier: Apache-2.0; adapted from jj-store 08b58c7e, see docs/provenance.json. -->
<script lang="ts">
  import { tick } from "svelte";
  import * as InputGroup from "@lapismd/design-core/shadcn/input-group";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import SearchIcon from "@lucide/svelte/icons/search";
  import XIcon from "@lucide/svelte/icons/x";
  let {
    label,
    scope,
    query = "",
    open = $bindable(false),
    onQuery,
    live = false,
  }: {
    label: string;
    scope: string;
    query?: string;
    open?: boolean;
    live?: boolean;
    onQuery: (value: string) => void | Promise<void>;
  } = $props();
  let search = $state("");
  let input: HTMLInputElement | null = $state(null);
  let trigger: HTMLButtonElement | null = $state(null);
  let hovered = $state(false);
  // Only Clear retains the open input when the submitted query changes.
  let keepOpenForScope: string | undefined;
  $effect(() => {
    const currentScope = scope;
    search = query;
    open = !!query || keepOpenForScope === currentScope;
    keepOpenForScope = undefined;
  });
  async function show() {
    open = true;
    await tick();
    input?.focus();
  }
  async function close() {
    keepOpenForScope = undefined;
    search = "";
    open = false;
    if (query) await onQuery("");
    await tick();
    trigger?.focus({ preventScroll: true });
  }
  async function clear() {
    search = "";
    if (query) {
      keepOpenForScope = scope;
      await onQuery("");
    }
    await tick();
    input?.focus({ preventScroll: true });
  }
</script>

<Button
  bind:ref={trigger}
  class="ai-session-search__action ai-session-search__close"
  data-open={open ? "" : undefined}
  data-hovered={hovered ? "" : undefined}
  onpointerenter={() => (hovered = true)}
  onpointerleave={() => (hovered = false)}
  size="icon-sm"
  variant="outline"
  aria-label={open ? "Close search" : label}
  title={open ? "Close search" : label}
  onclick={open ? close : show}
  ><span class="ai-session-search__search-icon" aria-hidden="true"
    ><SearchIcon /></span
  ><span class="ai-session-search__close-icon" aria-hidden="true"
    ><XIcon /></span
  ></Button
>
{#if open}
  <form
    class="ai-session-search"
    onsubmit={(event) => {
      event.preventDefault();
      void onQuery(search);
    }}
  >
    <InputGroup.Root style="height: calc(var(--spacing) * 8)">
      <InputGroup.Input
        onkeydown={(event) => {
          if (event.key === "Escape" && !event.defaultPrevented) {
            event.preventDefault();
            void close();
          }
        }}
        type={live ? "search" : "text"}
        oninput={(event) => {
          if (live) void onQuery(event.currentTarget.value);
        }}
        bind:ref={input}
        bind:value={search}
        maxlength={512}
        aria-label={label}
        placeholder={label}
      />
      {#if search.length > 0}<InputGroup.Addon align="inline-end"
          ><InputGroup.Button
            class="ai-session-search__action"
            size="icon-xs"
            variant="secondary"
            aria-label="Clear search"
            title="Clear search"
            onclick={clear}><XIcon aria-hidden="true" /></InputGroup.Button
          ></InputGroup.Addon
        >{/if}
    </InputGroup.Root>
  </form>
{/if}

<style>
  .ai-session-search {
    flex: 1;
    min-width: 0;
    padding: 0;
    min-height: 0;
    --ui-input-group-border-color: transparent;
    --ui-input-group-focus-ring-color: transparent;
  }
  .ai-session-search :global([data-ui-part="input-group"]),
  .ai-session-search :global([data-ui-part="input-group-input"]) {
    border: 0;
    outline: none;
    background: transparent;
    box-shadow: none;
  }
  :global(.ai-session-search__action) {
    border-radius: 50%;
  }
  :global(.ai-session-search__close[data-ui-component="button"]) {
    background: color-mix(in srgb, var(--muted) 38%, transparent);
  }
  .ai-session-search__search-icon {
    display: flex;
  }
  .ai-session-search__close-icon {
    display: none;
  }
  :global(.ai-session-search__close[data-open][data-hovered])
    .ai-session-search__search-icon,
  :global(.ai-session-search__close[data-open]:focus-visible)
    .ai-session-search__search-icon {
    display: none;
  }
  :global(.ai-session-search__close[data-open][data-hovered])
    .ai-session-search__close-icon,
  :global(.ai-session-search__close[data-open]:focus-visible)
    .ai-session-search__close-icon {
    display: flex;
  }
</style>
