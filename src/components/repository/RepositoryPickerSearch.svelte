<script lang="ts">
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import XIcon from "@lucide/svelte/icons/x";
  let {
    query = $bindable(""),
    inputRef = $bindable(null),
    placeholder,
    label,
    closeLabel,
    grid = true,
  }: {
    query?: string;
    inputRef?: HTMLInputElement | null;
    placeholder: string;
    label: string;
    closeLabel: string;
    grid?: boolean;
  } = $props();
</script>

<div class="repository-review-picker-search">
  <CommandView.Input
    aria-haspopup={grid ? "grid" : "listbox"}
    bind:ref={inputRef}
    bind:value={query}
    {placeholder}
    aria-label={label}
  />
  <Popover.Close>
    {#snippet child({ props })}<Button
        {...props}
        variant="ghost"
        size="icon-sm"
        aria-label={closeLabel}><XIcon aria-hidden="true" /></Button
      >{/snippet}
  </Popover.Close>
</div>

<style>
  .repository-review-picker-search {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.5rem;
    border-bottom: 1px solid var(--border);
    --ui-command-view-border-color: transparent;
  }
</style>
