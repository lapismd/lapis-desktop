<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import WrapText from "@lucide/svelte/icons/wrap-text";
  import Space from "@lucide/svelte/icons/space";
  import CaseSensitive from "@lucide/svelte/icons/case-sensitive";
  import ArrowRightLeft from "@lucide/svelte/icons/arrow-right-left";

  let {
    options = $bindable(),
    disabled = false,
  }: {
    options: {
      wrap: boolean;
      ignoreWhitespace: boolean;
      ignoreCase: boolean;
      syncHorizontalScroll: boolean;
    };
    disabled?: boolean;
  } = $props();
  const actions = [
    { key: "wrap", label: "Wrap text", icon: WrapText },
    { key: "ignoreWhitespace", label: "Ignore whitespace", icon: Space },
    { key: "ignoreCase", label: "Ignore case", icon: CaseSensitive },
    {
      key: "syncHorizontalScroll",
      label: "Synchronize horizontal scrolling",
      icon: ArrowRightLeft,
    },
  ] as const;
</script>

<div class="merge-controls" role="group" aria-label="Merge editor settings">
  <Tooltip.Provider>
    {#each actions as action (action.key)}
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <Button
              {...props}
              variant="ghost"
              size="icon-sm"
              {disabled}
              aria-label={action.label}
              aria-pressed={options[action.key]}
              onclick={() =>
                (options = { ...options, [action.key]: !options[action.key] })}
            >
              <action.icon aria-hidden="true" />
            </Button>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content side="bottom">{action.label}</Tooltip.Content>
      </Tooltip.Root>
    {/each}
  </Tooltip.Provider>
</div>

<style>
  .merge-controls {
    display: flex;
    align-items: center;
    gap: 0.125rem;
  }
</style>
