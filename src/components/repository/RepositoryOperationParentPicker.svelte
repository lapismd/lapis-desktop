<script lang="ts">
  import type { LocalGraphOperationNode } from "@lapismd/jj-history";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import RepositoryPickerSearch from "./RepositoryPickerSearch.svelte";
  import RepositoryOperationOption from "./RepositoryOperationOption.svelte";
  import RepositoryIdentifiers from "./RepositoryIdentifiers.svelte";
  import RepositoryComparisonBar from "./RepositoryComparisonBar.svelte";
  import RepositoryParentSummary from "./RepositoryParentSummary.svelte";
  import RepositoryComparisonTime from "./RepositoryComparisonTime.svelte";
  import "./repository-commit-picker.css";
  let {
    parents,
    nodes,
    target,
    loading = false,
    onOpen,
    onSelect,
    copyText,
  }: {
    parents: readonly string[];
    nodes: readonly LocalGraphOperationNode[];
    target?: string;
    loading?: boolean;
    onOpen(): void;
    onSelect(id: string): void;
    copyText(value: string): Promise<void>;
  } = $props();
  const id = $props.id();
  let open = $state(false),
    query = $state(""),
    highlighted = $state("");
  let searchInput = $state<HTMLInputElement | null>(null);
  const options = $derived(
    parents.map((id) => {
      const operation = nodes.find((node) => node.id === id);
      return {
        id,
        operation,
        search: [
          id,
          operation?.description,
          operation?.user,
          operation?.host,
          operation?.workspace,
          operation?.is_snapshot ? "snapshot" : "",
        ]
          .join(" ")
          .toLocaleLowerCase(),
      };
    }),
  );
  const selected = $derived(options.find((option) => option.id === target));
  const visible = $derived(
    options.filter((option) =>
      option.search.includes(query.trim().toLocaleLowerCase()),
    ),
  );
  const missing = $derived(options.some((option) => !option.operation));
  function handleOpen(next: boolean) {
    open = next;
    if (next) {
      query = "";
      highlighted = target ?? parents[0] ?? "";
      onOpen();
    }
  }
</script>

<Popover.Root {open} onOpenChange={handleOpen}>
  <RepositoryComparisonBar>
    <div class="repository-review-parent-selector">
      <Popover.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="outline"
            size="xs"
            class="repository-review-parent-trigger"
            role="combobox"
            aria-label="Compare operation with parent"
            aria-describedby={`${id}-value`}
            value={target ?? ""}
            data-parent={target}
          >
            <ChevronDownIcon data-icon="inline-end" aria-hidden="true" />
          </Button>
        {/snippet}
      </Popover.Trigger>
      <div class="repository-review-parent-value" id={`${id}-value`}>
        <RepositoryParentSummary
          {target}
          author={selected?.operation?.user}
          handle={selected?.operation
            ? `${selected?.operation.user}@${selected?.operation.host}`
            : undefined}
          description={selected?.operation?.description}
        />
        <span class="repository-review-parent-identifiers">
          <RepositoryIdentifiers
            {copyText}
            commitId={target ?? ""}
            commitLabel="operation ID"
            placement="inline"
          />
        </span>
        <RepositoryComparisonTime
          timestamp={selected?.operation
            ? Number(selected.operation.end.millis)
            : undefined}
        />
      </div>
    </div>
  </RepositoryComparisonBar>
  <Popover.Content
    align="start"
    sideOffset={6}
    class="repository-commit-picker repository-review-identifier-surface"
    role="dialog"
    aria-label="Choose operation parent"
    onOpenAutoFocus={(event) => {
      event.preventDefault();
      searchInput?.focus();
    }}
    style="--ui-popover-width:min(42rem,calc(100vw - 2rem));--ui-popover-padding:0;--ui-popover-gap:0"
  >
    <CommandView.Root
      class="repository-review-picker-options"
      bind:value={highlighted}
      label="Select operation parent"
      shouldFilter={false}
    >
      <RepositoryPickerSearch
        bind:inputRef={searchInput}
        bind:query
        placeholder="Find operation, author or ID"
        label="Find operation"
        closeLabel="Close operation selector"
      />
      <CommandView.List role="grid" aria-label="Recorded operation parents">
        {#if !visible.length}<CommandView.Empty role="row"
            ><span role="gridcell">No matching operations</span
            ></CommandView.Empty
          >
        {:else}<CommandView.Group role="rowgroup">
            {#each visible as option (option.id)}
              <CommandView.Item
                role="row"
                value={option.id}
                keywords={[option.search]}
                aria-label={`Select operation parent ${option.operation?.description.split("\n")[0] || "Unknown parent"} (${option.id})`}
                data-operation={option.id}
                class="repository-commit-picker-option"
                data-current={option.id === target || undefined}
                onSelect={() => {
                  open = false;
                  onSelect(option.id);
                }}
              >
                <span role="gridcell" class="repository-commit-picker-selection"
                  >{#if option.id === target}<CircleCheckIcon
                      fill="var(--foreground)"
                      stroke="var(--background)"
                      aria-hidden="true"
                    />{/if}</span
                >
                <RepositoryOperationOption
                  target={option.id}
                  operation={option.operation}
                  {copyText}
                />
              </CommandView.Item>
            {/each}
          </CommandView.Group>{/if}
      </CommandView.List>
      {#if missing}<CommandView.Footer>
          <Button variant="ghost" size="sm" disabled={loading} onclick={onOpen}
            >{loading
              ? "Loading parent details…"
              : "Retry parent details"}</Button
          >
        </CommandView.Footer>{/if}
    </CommandView.Root>
  </Popover.Content>
</Popover.Root>
