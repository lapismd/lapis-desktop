<script lang="ts">
  import type {
    LocalGraphCommit,
    LocalOperationChangesGroup,
  } from "@lapismd/jj-history";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { TagList } from "@lapismd/design-core/shadcn/tag-list";
  import GitBranchIcon from "@lucide/svelte/icons/git-branch";
  import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
  import RepositoryPickerSearch from "./RepositoryPickerSearch.svelte";
  import RepositoryRevisionOption from "./RepositoryRevisionOption.svelte";
  import {
    repositoryCommitSearch,
    repositoryCommitTags,
  } from "../../lib/repository/tags.ts";
  import "./repository-commit-picker.css";
  let {
    groups,
    selected,
    commits,
    disabled = false,
    onSelect,
    copyText,
    onOpen,
  }: {
    groups: LocalOperationChangesGroup[];
    selected?: string;
    commits: LocalGraphCommit[];
    disabled?: boolean;
    onSelect(id: string): void;
    copyText(value: string): Promise<void>;
    onOpen?(): void;
  } = $props();
  let open = $state(false),
    query = $state(""),
    highlighted = $state("");
  let searchInput = $state<HTMLInputElement | null>(null);
  const options = $derived(
    groups.map((group) => {
      const commit = commits.find((commit) =>
        [...group.after, ...group.before].includes(commit.id),
      );
      return {
        group,
        commit,
        target: commit?.id ?? group.after[0] ?? group.before[0] ?? "",
      };
    }),
  );
  const visible = $derived(
    options.filter((option) =>
      `${option.group.change} ${repositoryCommitSearch(option.target, option.commit)}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
    ),
  );
  const preview = $derived(
    options.find((option) => option.group.change === highlighted) ??
      options.find((option) => option.group.change === selected),
  );
</script>

<Popover.Root
  {open}
  onOpenChange={(next) => {
    open = next;
    if (next) {
      onOpen?.();
      query = "";
      highlighted = selected ?? groups[0]?.change ?? "";
    }
  }}
>
  <Popover.Trigger
    >{#snippet child({ props })}
      <Button
        {...props}
        size="xs"
        variant="outline"
        aria-label="Choose changed revisions"
        title="Changed revision"
        {disabled}
        ><GitBranchIcon
          data-icon="inline-start"
          aria-hidden="true"
        />Revisions</Button
      >
    {/snippet}</Popover.Trigger
  >
  <Popover.Content
    align="end"
    class="repository-commit-picker repository-review-identifier-surface"
    role="dialog"
    aria-label="Choose changed revisions"
    onOpenAutoFocus={(event) => {
      event.preventDefault();
      searchInput?.focus();
    }}
    style="--ui-popover-width:min(42rem,calc(100vw - 2rem));--ui-popover-padding:0;--ui-popover-gap:0"
  >
    <CommandView.Root
      class="repository-review-picker-options"
      bind:value={highlighted}
      label="Select changed revision"
      shouldFilter={false}
    >
      <RepositoryPickerSearch
        bind:inputRef={searchInput}
        bind:query
        placeholder="Find revision, author or ID"
        label="Find changed revision"
        closeLabel="Close revision picker"
      />
      <CommandView.List
        role="grid"
        aria-label="Revisions in selected operation"
      >
        {#if !visible.length}<CommandView.Empty role="row"
            ><span role="gridcell">No matching revisions</span
            ></CommandView.Empty
          >
        {:else}<CommandView.Group role="rowgroup">
            {#each visible as option (option.group.change)}
              <CommandView.Item
                role="row"
                value={option.group.change}
                data-change={option.group.change}
                aria-label={`Choose ${option.commit?.description.split("\n")[0] ?? option.group.change} (${option.group.change})`}
                class="repository-commit-picker-option"
                onSelect={() => {
                  open = false;
                  onSelect(option.group.change);
                }}
              >
                <span role="gridcell" class="repository-commit-picker-selection"
                  >{#if option.group.change === selected}<CircleCheckIcon
                      fill="var(--foreground)"
                      stroke="var(--background)"
                      aria-hidden="true"
                    />{/if}</span
                >
                <RepositoryRevisionOption
                  target={option.target}
                  commit={option.commit}
                  {copyText}
                />
              </CommandView.Item>
            {/each}
          </CommandView.Group>{/if}
      </CommandView.List>
      <CommandView.Footer>
        <TagList
          tags={repositoryCommitTags(preview?.commit)}
          label="Preview revision tags"
        />
        {#if preview}<span
            >{preview.group.before.length} before · {preview.group.after.length}
            after</span
          >{/if}
      </CommandView.Footer>
    </CommandView.Root>
  </Popover.Content>
</Popover.Root>
