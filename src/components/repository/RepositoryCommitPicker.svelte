<script lang="ts">
  import type { Snippet } from "svelte";
  import type { LocalGraphCommit } from "@lapismd/jj-history";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { TagList } from "@lapismd/design-core/shadcn/tag-list";
  import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import RepositoryPickerSearch from "./RepositoryPickerSearch.svelte";
  import RepositoryRevisionOption from "./RepositoryRevisionOption.svelte";
  import RepositoryIdentifiers from "./RepositoryIdentifiers.svelte";
  import { encodeJjChangeId } from "../../lib/repository/graph/repository-log-graph.ts";
  import RepositoryParentSummary from "./RepositoryParentSummary.svelte";
  import RepositoryComparisonBar from "./RepositoryComparisonBar.svelte";
  import RepositoryComparisonTime from "./RepositoryComparisonTime.svelte";
  import {
    repositoryCommitSearch,
    repositoryCommitTags,
  } from "../../lib/repository/tags.ts";
  import "./repository-commit-picker.css";
  let {
    parents,
    revisions,
    target,
    loading = false,
    onOpen,
    onSelect,
    statistics,
    copyText,
    comparisonLabel = "Comparison parent",
  }: {
    parents: readonly string[];
    revisions: readonly LocalGraphCommit[];
    target?: string;
    loading?: boolean;
    onOpen(): void;
    onSelect(id: string): void;
    statistics?: Snippet;
    copyText(value: string): Promise<void>;
    comparisonLabel?: string;
  } = $props();
  const id = $props.id();
  let open = $state(false),
    query = $state(""),
    highlighted = $state("");
  let searchInput = $state<HTMLInputElement | null>(null);
  const options = $derived(
    parents.map((id) => ({
      id,
      commit: revisions.find((commit) => commit.id === id),
    })),
  );
  const selected = $derived(options.find((option) => option.id === target));
  const preview = $derived(
    options.find((option) => option.id === highlighted) ?? selected,
  );
  const visible = $derived(
    options.filter((option) =>
      repositoryCommitSearch(option.id, option.commit).includes(
        query.trim().toLocaleLowerCase(),
      ),
    ),
  );
  const missing = $derived(options.some((option) => !option.commit));
  function handleOpen(next: boolean) {
    open = next;
    if (next) {
      query = "";
      highlighted = target ?? parents[0] ?? "";
      onOpen();
    }
  }
  function choose(id: string) {
    open = false;
    onSelect(id);
  }
</script>

<Popover.Root {open} onOpenChange={handleOpen}>
  <RepositoryComparisonBar inset label={comparisonLabel}>
    <div class="repository-review-parent-selector">
      <Popover.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="outline"
            size="xs"
            class="repository-review-parent-trigger"
            role="combobox"
            aria-label={comparisonLabel === "Previous version"
              ? "Compare with previous version"
              : "Compare with parent"}
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
          author={selected?.commit?.author.name}
          email={selected?.commit?.author.email}
          description={selected?.commit?.description}
        />
        <span class="repository-review-parent-identifiers">
          <RepositoryIdentifiers
            {copyText}
            commitId={target ?? ""}
            changeId={selected?.commit
              ? encodeJjChangeId(selected.commit.change_id)
              : ""}
            placement="inline"
          />
        </span>
        <RepositoryComparisonTime
          timestamp={selected?.commit
            ? Number(selected.commit.author.timestamp.millis)
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
    aria-label={`Choose ${comparisonLabel.toLocaleLowerCase()}`}
    onOpenAutoFocus={(event) => {
      event.preventDefault();
      searchInput?.focus();
    }}
    style="--ui-popover-width: min(42rem, calc(100vw - 2rem)); --ui-popover-padding: 0; --ui-popover-gap: 0"
  >
    <CommandView.Root
      class="repository-review-picker-options"
      bind:value={highlighted}
      label={`Select ${comparisonLabel.toLocaleLowerCase()}`}
      shouldFilter={false}
    >
      <RepositoryPickerSearch
        grid
        bind:inputRef={searchInput}
        bind:query
        placeholder="Find commit"
        label={`Select ${comparisonLabel.toLocaleLowerCase()}`}
        closeLabel="Close commit selector"
      />
      <CommandView.List role="grid">
        {#if !visible.length}<CommandView.Empty role="row"
            ><span role="gridcell">No matching commits</span></CommandView.Empty
          >
        {:else}<CommandView.Group role="rowgroup">
            {#each visible as option (option.id)}
              <CommandView.Item
                role="row"
                value={option.id}
                keywords={[repositoryCommitSearch(option.id, option.commit)]}
                aria-label={`Select ${comparisonLabel.toLocaleLowerCase()} ${option.commit?.description.split("\n")[0] || "Unknown version"} (${option.id})`}
                data-commit={option.id}
                class="repository-commit-picker-option"
                data-current={option.id === target || undefined}
                onSelect={() => choose(option.id)}
              >
                <span role="gridcell" class="repository-commit-picker-selection"
                  >{#if option.id === target}<CircleCheckIcon
                      fill="var(--foreground)"
                      stroke="var(--background)"
                      aria-hidden="true"
                    />{/if}</span
                >
                <RepositoryRevisionOption
                  target={option.id}
                  commit={option.commit}
                  {copyText}
                />
              </CommandView.Item>
            {/each}
          </CommandView.Group>{/if}
      </CommandView.List>
      <CommandView.Footer>
        <section aria-label="Commit tag preview" data-commit={preview?.id}>
          <TagList
            tags={repositoryCommitTags(preview?.commit)}
            label="Preview commit tags"
          />
        </section>
        {#if statistics}{@render statistics()}{/if}
        {#if missing}<Button
            variant="ghost"
            size="sm"
            disabled={loading}
            onclick={onOpen}
            >{loading
              ? "Loading parent details…"
              : "Retry parent details"}</Button
          >{/if}
      </CommandView.Footer>
    </CommandView.Root>
  </Popover.Content>
</Popover.Root>
