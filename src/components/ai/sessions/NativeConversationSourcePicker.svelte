<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import MessagesSquareIcon from "@lucide/svelte/icons/messages-square";
  import MessageSquareTextIcon from "@lucide/svelte/icons/message-square-text";
  import HistoryIcon from "@lucide/svelte/icons/history";
  import CheckIcon from "@lucide/svelte/icons/check";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import XIcon from "@lucide/svelte/icons/x";

  let {
    sources,
    value,
    disabled = false,
    onSelect,
  }: {
    sources: { value: string; label: string; description: string }[];
    value: string;
    disabled?: boolean;
    onSelect(value: string): void;
  } = $props();
  let open = $state(false),
    query = $state("");
  let input = $state<HTMLInputElement | null>(null);
  const selected = $derived(sources.find((source) => source.value === value));
  const visible = $derived(
    sources.filter((source) =>
      `${source.label} ${source.description}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
    ),
  );
  const icon = (source: string) =>
    source === "history"
      ? MessagesSquareIcon
      : source === "thread"
        ? MessageSquareTextIcon
        : HistoryIcon;
  const SelectedIcon = $derived(icon(value));
</script>

<Popover.Root bind:open onOpenChange={() => (query = "")}>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="ghost"
        size="xs"
        class="native-conversation-source-button"
        {disabled}
        aria-label={`Conversation source: ${selected?.label ?? "Choose source"}`}
      >
        <SelectedIcon data-icon="inline-start" aria-hidden="true" />
        <span class="source-label">{selected?.label ?? "Choose source"}</span>
        <ChevronDownIcon data-icon="inline-end" aria-hidden="true" />
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content
    side="top"
    align="start"
    sideOffset={8}
    collisionPadding={12}
    role="dialog"
    aria-label="Conversation sources"
    style="--ui-popover-width:min(28rem,calc(100vw - 2rem));--ui-popover-padding:0;--ui-popover-gap:0"
    onOpenAutoFocus={(event) => {
      event.preventDefault();
      input?.focus();
    }}
  >
    <CommandView.Root label="Select conversation source" shouldFilter={false}>
      <div class="source-search">
        <CommandView.Input
          bind:ref={input}
          bind:value={query}
          placeholder="Find conversation source"
          aria-label="Find conversation source"
        />
        <Popover.Close>
          {#snippet child({ props })}<Button
              {...props}
              variant="ghost"
              size="icon-sm"
              aria-label="Close source picker"
              ><XIcon aria-hidden="true" /></Button
            >{/snippet}
        </Popover.Close>
      </div>
      <CommandView.List aria-label="Retained conversation sources">
        <CommandView.Empty>No matching sources</CommandView.Empty>
        <CommandView.Group>
          {#each visible as source (source.value)}
            {@const Icon = icon(source.value)}
            <CommandView.Item
              value={source.value}
              aria-label={source.label}
              onSelect={() => {
                open = false;
                onSelect(source.value);
              }}
            >
              <CommandView.ItemIcon
                ><Icon aria-hidden="true" /></CommandView.ItemIcon
              >
              <CommandView.ItemLabel>{source.label}</CommandView.ItemLabel>
              <CommandView.ItemDescription
                >{source.description}</CommandView.ItemDescription
              >
              {#if source.value === value}<span class="source-check"
                  ><CheckIcon aria-label="Selected source" /></span
                >{/if}
            </CommandView.Item>
          {/each}
        </CommandView.Group>
      </CommandView.List>
    </CommandView.Root>
  </Popover.Content>
</Popover.Root>

<style>
  :global(.native-conversation-source-button[data-ui-component="button"]) {
    min-width: 0;
    max-width: 100%;
    flex-shrink: 1;
    border: 0;
  }
  .source-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .source-search {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.5rem;
    border-bottom: 1px solid var(--border);
    --ui-command-view-border-color: transparent;
  }
  .source-check {
    grid-area: shortcut;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
  .source-check > :global(svg) {
    width: 0.875rem;
    height: 0.875rem;
  }
</style>
