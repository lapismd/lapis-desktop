<script lang="ts">
  import type { LocalGraphOperationNode } from "@lapismd/jj-history";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import HistoryIcon from "@lucide/svelte/icons/history";
  import RepositoryPickerSearch from "./RepositoryPickerSearch.svelte";
  import RepositoryOperationOption from "./RepositoryOperationOption.svelte";
  import "./repository-commit-picker.css";
  let {
    operations,
    operation,
    nodes = [],
    label,
    onSelect,
    copyText,
  }: {
    operations: readonly string[];
    operation?: string;
    nodes?: readonly LocalGraphOperationNode[];
    label: string;
    onSelect(id: string): void;
    copyText(value: string): Promise<void>;
  } = $props();
  let open = $state(false),
    query = $state(""),
    highlighted = $state("");
  let searchInput = $state<HTMLInputElement | null>(null);
  const options = $derived(
    operations.map((id) => {
      const node = nodes.find((node) => node.id === id);
      return {
        id,
        node,
        search: [id, node?.description, node?.user, node?.host, node?.workspace]
          .join(" ")
          .toLocaleLowerCase(),
      };
    }),
  );
  const visible = $derived(
    options.filter((option) =>
      option.search.includes(query.trim().toLocaleLowerCase()),
    ),
  );
  const short = (id: string) => `${id.slice(0, 8)}…${id.slice(-4)}`;
</script>

<Popover.Root
  {open}
  onOpenChange={(next) => {
    open = next;
    if (next) {
      query = "";
      highlighted = operation ?? operations[0] ?? "";
    }
  }}
>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="outline"
        size="sm"
        class="repository-review-operation-pin-trigger"
        role="combobox"
        aria-label={label}
        title={operation
          ? `Pinned operation ${operation}`
          : "Select an operation"}
        value={operation ?? ""}
        disabled={!operations.length}
      >
        <HistoryIcon aria-hidden="true" /><span
          >{operation ? short(operation) : "Operation"}</span
        >
        <ChevronDownIcon aria-hidden="true" />
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content
    align="end"
    class="repository-commit-picker repository-review-identifier-surface"
    role="dialog"
    aria-label="Select operation snapshot"
    onOpenAutoFocus={(event) => {
      event.preventDefault();
      searchInput?.focus();
    }}
    style="--ui-popover-width:min(42rem,calc(100vw - 2rem));--ui-popover-padding:0;--ui-popover-gap:0"
  >
    <CommandView.Root
      class="repository-review-picker-options"
      bind:value={highlighted}
      label="Select operation snapshot"
      shouldFilter={false}
      loop
    >
      <RepositoryPickerSearch
        bind:inputRef={searchInput}
        bind:query
        placeholder="Find operation, author or ID"
        label="Find operation"
        closeLabel="Close operation picker"
      />
      <CommandView.List role="grid" aria-label="Repository operations">
        {#if !visible.length}<CommandView.Empty role="row"
            ><span role="gridcell">No matching operations</span
            ></CommandView.Empty
          >
        {:else}<CommandView.Group role="rowgroup">
            {#each visible as option (option.id)}
              <CommandView.Item
                role="row"
                value={option.id}
                aria-label={`Select operation ${option.id}`}
                data-current={option.id === operation || undefined}
                class="repository-commit-picker-option"
                onSelect={() => {
                  open = false;
                  onSelect(option.id);
                }}
              >
                <span
                  role="gridcell"
                  class="repository-commit-picker-selection"
                >
                  {#if option.id === operation}<CircleCheckIcon
                      fill="var(--foreground)"
                      stroke="var(--background)"
                      aria-hidden="true"
                    />{/if}
                </span>
                <RepositoryOperationOption
                  target={option.id}
                  operation={option.node}
                  fallbackDescription={option.id === operation
                    ? "Pinned operation"
                    : "Repository operation"}
                  {copyText}
                />
              </CommandView.Item>
            {/each}
          </CommandView.Group>{/if}
      </CommandView.List>
    </CommandView.Root>
  </Popover.Content>
</Popover.Root>

<style>
  :global(
      .repository-review-operation-pin-trigger[data-ui-component="button"]
    ) {
    min-width: 0;
    max-width: 10.5rem;
    flex: 0 1 auto;
    height: 1.75rem;
    padding-inline: 0.45rem;
    font-size: 0.75rem;
    --ui-button-radius: var(--radius);
  }
  :global(.repository-review-operation-pin-trigger > span) {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
