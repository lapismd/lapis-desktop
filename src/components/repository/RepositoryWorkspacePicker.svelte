<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import CheckIcon from "@lucide/svelte/icons/circle-check";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import FolderGit2Icon from "@lucide/svelte/icons/folder-git-2";
  import RepositoryPickerSearch from "./RepositoryPickerSearch.svelte";
  import { encodeJjChangeId } from "../../lib/repository/graph/repository-log-graph.ts";
  import type { RepositoryWorkspace } from "../../lib/repository/workspaces.ts";
  let {
    workspaces,
    selected,
    disabled = false,
    onOpen,
    onSelect,
  }: {
    workspaces: readonly RepositoryWorkspace[];
    selected: string | null;
    disabled?: boolean;
    onOpen?(): void;
    onSelect(workspace: string | null): void;
  } = $props();
  let open = $state(false),
    query = $state(""),
    highlighted = $state("");
  let input = $state<HTMLInputElement | null>(null);
  const options = $derived([
    {
      value: "overview",
      name: "Repository overview",
      description: "Browse without workspace context",
      workspace: null,
    },
    ...workspaces.map(({ name, commit }) => ({
      value: `workspace:${name}`,
      name,
      description: `${encodeJjChangeId(commit.change_id).slice(0, 12)} · ${commit.description.split("\n")[0] || "No description"}`,
      workspace: name,
    })),
  ]);
  const visible = $derived(
    options.filter((option) =>
      `${option.name} ${option.description}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
    ),
  );
</script>

<Popover.Root
  {open}
  onOpenChange={(next) => {
    open = next;
    if (next) {
      onOpen?.();
      query = "";
      highlighted = selected ? `workspace:${selected}` : "overview";
    }
  }}
>
  <Popover.Trigger
    >{#snippet child({ props })}
      <Button
        {...props}
        variant="outline"
        size="sm"
        class="repository-review-workspace-trigger"
        role="combobox"
        aria-label="Repository workspace"
        title="Select workspace"
        {disabled}
      >
        <FolderGit2Icon aria-hidden="true" /><span
          >{selected ?? "Repository overview"}</span
        >
        <ChevronDownIcon aria-hidden="true" />
      </Button>
    {/snippet}</Popover.Trigger
  >
  <Popover.Content
    align="end"
    role="dialog"
    aria-label="Select workspace"
    style="--ui-popover-width:min(28rem,calc(100vw - 2rem));--ui-popover-padding:0;--ui-popover-gap:0"
    onOpenAutoFocus={(event) => {
      event.preventDefault();
      input?.focus();
    }}
  >
    <CommandView.Root
      bind:value={highlighted}
      label="Select workspace"
      shouldFilter={false}
      loop
    >
      <RepositoryPickerSearch
        grid={false}
        bind:inputRef={input}
        bind:query
        label="Search workspaces"
        placeholder="Search loaded workspaces"
        closeLabel="Close workspace selector"
      />
      <CommandView.List aria-label="Repository workspaces">
        {#if !visible.length}<CommandView.Empty
            >No matching workspaces.</CommandView.Empty
          >
        {:else}<CommandView.Group>
            {#each visible as option (option.value)}
              <CommandView.Item
                value={option.value}
                aria-label={option.name}
                data-current={option.workspace === selected || undefined}
                onSelect={() => {
                  open = false;
                  onSelect(option.workspace);
                }}
              >
                <CommandView.ItemIcon
                  >{#if option.workspace === selected}<CheckIcon
                      aria-hidden="true"
                    />
                  {:else}<FolderGit2Icon
                      aria-hidden="true"
                    />{/if}</CommandView.ItemIcon
                >
                <CommandView.ItemLabel>{option.name}</CommandView.ItemLabel>
                <CommandView.ItemDescription
                  >{option.description}</CommandView.ItemDescription
                >
              </CommandView.Item>
            {/each}
          </CommandView.Group>{/if}
      </CommandView.List>
    </CommandView.Root>
  </Popover.Content>
</Popover.Root>

<style>
  :global(.repository-review-workspace-trigger[data-ui-component="button"]) {
    min-width: 0;
    max-width: 10.5rem;
    flex: 0 1 auto;
    height: 1.75rem;
    padding-inline: 0.45rem;
    font-size: 0.75rem;
    --ui-button-radius: var(--radius);
  }
  :global(.repository-review-workspace-trigger > span) {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
