<script lang="ts">
  import type { Snippet } from "svelte";
  import type { LocalGraphCommit } from "@lapismd/jj-history";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { TagList } from "@lapismd/design-core/shadcn/tag-list";
  import CheckIcon from "@lucide/svelte/icons/check";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import XIcon from "@lucide/svelte/icons/x";
  import RepositoryCommitTarget from "./RepositoryCommitTarget.svelte";
  import {
    commitCardSearch,
    commitCardTags,
  } from "../../lib/repository/commit-cards.ts";
  import "./repository-commit-picker.css";
  let {
    parents,
    revisions,
    target,
    loading = false,
    onOpen,
    onSelect,
    statistics,
  }: {
    parents: readonly string[];
    revisions: readonly LocalGraphCommit[];
    target?: string;
    loading?: boolean;
    onOpen(): void;
    onSelect(id: string): void;
    statistics?: Snippet;
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
      commitCardSearch(option.id, option.commit).includes(
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
  <div class="repository-commit-picker-control">
    <Popover.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="outline"
          class="repository-commit-picker-trigger"
          role="combobox"
          aria-label="Compare with parent"
          aria-describedby={`${id}-value`}
          value={target ?? ""}
          data-parent={target}
        >
          <ChevronDownIcon aria-hidden="true" />
        </Button>
      {/snippet}
    </Popover.Trigger>
    <div id={`${id}-value`} class="repository-commit-picker-value">
      <RepositoryCommitTarget target={target ?? ""} commit={selected?.commit} />
    </div>
  </div>
  <Popover.Content
    align="start"
    sideOffset={6}
    class="repository-commit-picker"
    role="dialog"
    aria-label="Choose comparison parent"
    onOpenAutoFocus={(event) => {
      event.preventDefault();
      searchInput?.focus();
    }}
    style="--ui-popover-width: min(42rem, calc(100vw - 2rem)); --ui-popover-padding: 0.5rem 0.75rem 0.625rem; --ui-popover-gap: 0.25rem"
  >
    <Popover.Header class="repository-commit-picker-header">
      <Popover.Title>Choose comparison parent</Popover.Title>
      <Popover.Close
        >{#snippet child({ props })}<Button
            {...props}
            variant="ghost"
            size="icon-sm"
            aria-label="Close commit selector"
            ><XIcon aria-hidden="true" /></Button
          >{/snippet}</Popover.Close
      >
    </Popover.Header>
    <CommandView.Root
      bind:value={highlighted}
      label="Select comparison parent"
      shouldFilter={false}
    >
      <CommandView.Input
        bind:ref={searchInput}
        bind:value={query}
        placeholder="Find commit"
        aria-label="Find commit"
      />
      <CommandView.List>
        {#if !visible.length}<CommandView.Empty
            >No matching commits</CommandView.Empty
          >
        {:else}<CommandView.Group heading="Recorded parents">
            {#each visible as option (option.id)}
              <CommandView.Item
                value={option.id}
                keywords={[commitCardSearch(option.id, option.commit)]}
                aria-label={`Select comparison parent ${option.commit?.description.split("\n")[0] || "Unknown parent"} (${option.id})`}
                data-commit={option.id}
                class="repository-commit-picker-option"
                data-current={option.id === target || undefined}
                onSelect={() => choose(option.id)}
              >
                <span class="repository-commit-picker-selection"
                  >{#if option.id === target}<CheckIcon
                      aria-hidden="true"
                    />{/if}</span
                >
                <RepositoryCommitTarget
                  target={option.id}
                  commit={option.commit}
                />
              </CommandView.Item>
            {/each}
          </CommandView.Group>{/if}
      </CommandView.List>
      <CommandView.Footer>
        <section aria-label="Commit tag preview" data-commit={preview?.id}>
          <TagList
            tags={commitCardTags(preview?.commit)}
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
