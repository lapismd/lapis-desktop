<script lang="ts">
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import GitBranch from "@lucide/svelte/icons/git-branch";
  import History from "@lucide/svelte/icons/history";
  import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
  import type {
    HistorySourcePicker,
    HistorySource,
  } from "../../lib/repository/history-source.ts";
  let { picker }: { picker: HistorySourcePicker } = $props();
  let open = $state(false),
    loading = $state(false),
    original = $state(false);
  const options = [
    {
      source: "backup" as HistorySource,
      label: "Automatic vault history",
      description: "Saved-file checkpoints managed by this plugin",
    },
    {
      source: "original" as HistorySource,
      label: "Original repository",
      description: "Read existing JJ history without changing it",
    },
  ];
  async function load() {
    loading = true;
    try {
      original = (await picker.load()).original;
    } catch (error) {
      picker.report(error);
    } finally {
      loading = false;
    }
  }
</script>

<Popover.Root
  bind:open
  onOpenChange={(next) => {
    if (next) void load();
  }}
>
  <Popover.Trigger>
    {#snippet child({ props })}<Button
        {...props}
        variant="ghost"
        size="sm"
        aria-label={`History source: ${picker.selected === "backup" ? "Backup" : "Original"}`}
        title="Select history source"
      >
        {#if picker.selected === "backup"}<History
            aria-hidden="true"
          />{:else}<GitBranch aria-hidden="true" />{/if}
        {picker.selected === "backup" ? "Backup" : "Original"}
      </Button>{/snippet}
  </Popover.Trigger>
  <Popover.Content
    align="end"
    aria-label="Select history source"
    style="--ui-popover-width:min(24rem,calc(100vw - 2rem));--ui-popover-padding:0"
  >
    <CommandView.Root label="Select history source" shouldFilter={false}>
      <CommandView.List aria-label="History sources">
        {#if loading}<div
            class="loading"
            role="status"
            aria-label="Loading history sources"
          >
            <Skeleton style="height:2rem" /><Skeleton style="height:2rem" />
          </div>
        {:else}<CommandView.Group>
            {#each options.filter((item) => item.source === "backup" || original || picker.selected === "original") as option (option.source)}
              <CommandView.Item
                value={option.source}
                onSelect={() => {
                  open = false;
                  if (option.source !== picker.selected)
                    picker.select(option.source);
                }}
              >
                <CommandView.ItemIcon
                  >{#if option.source === picker.selected}<CircleCheckIcon
                      fill="var(--foreground)"
                      stroke="var(--background)"
                      aria-hidden="true"
                    />{:else if option.source === "original"}<GitBranch
                      aria-hidden="true"
                    />{:else}<History
                      aria-hidden="true"
                    />{/if}</CommandView.ItemIcon
                >
                <CommandView.ItemLabel>{option.label}</CommandView.ItemLabel>
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
  .loading {
    display: grid;
    gap: 0.5rem;
    padding: 0.75rem;
  }
</style>
