<!-- SPDX-License-Identifier: Apache-2.0; copied/adapted from jj-store StoreAgentModelSelect. -->
<script lang="ts">
  import { tick } from "svelte";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
  import ChevronsUpDown from "@lucide/svelte/icons/chevrons-up-down";
  let {
    id,
    value = $bindable(null),
    options,
    disabled = false,
    allowCustom = false,
    allowDefault = true,
    defaultLabel = "Harness default",
    ariaLabel = "Model",
    onChange,
  }: {
    id: string;
    value: string | null | undefined;
    options: readonly { id: string; name: string; description?: string }[];
    disabled?: boolean;
    allowCustom?: boolean;
    allowDefault?: boolean;
    defaultLabel?: string;
    ariaLabel?: string;
    onChange?: () => void;
  } = $props();
  let open = $state(false);
  let custom = $state(false);
  const label = $derived(
    options.find((o) => o.id === value)?.name ??
      (value ? `${value} (saved preference)` : defaultLabel),
  );
  let trigger: HTMLButtonElement | null = $state(null);
  async function select(next: string | null) {
    value = next;
    custom = false;
    open = false;
    onChange?.();
    await tick();
    trigger?.focus();
  }
</script>

<Popover.Root bind:open>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button
        {...props}
        {id}
        bind:ref={trigger}
        variant="outline"
        {disabled}
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        class="chat-agent-model-trigger"
      >
        <span>{label}</span><ChevronsUpDown aria-hidden="true" />
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content class="chat-agent-model-menu" align="start">
    <Popover.Title class="sr-only">Choose model</Popover.Title>
    <CommandView.Root label="Search models" loop>
      <CommandView.Input
        aria-label="Search models"
        placeholder="Search models…"
      />
      <CommandView.List>
        <CommandView.Empty>No matching models.</CommandView.Empty>
        <CommandView.Group heading="Models">
          {#if allowDefault}<CommandView.Item
              value={defaultLabel}
              onSelect={() => select(null)}
              ><CommandView.ItemLabel>{defaultLabel}</CommandView.ItemLabel
              >{#if !value}<CircleCheckIcon
                  fill="var(--foreground)"
                  stroke="var(--background)"
                  aria-label="Selected"
                />{/if}</CommandView.Item
            >
          {/if}
          {#each options as option (option.id)}
            <CommandView.Item
              value={`${option.name} ${option.id} ${option.description ?? ""}`}
              aria-label={option.name}
              onSelect={() => select(option.id)}
              ><span class="model-option"
                ><CommandView.ItemLabel>{option.name}</CommandView.ItemLabel>
                {#if option.description}<CommandView.ItemDescription
                    >{option.description}</CommandView.ItemDescription
                  >{/if}</span
              >
              {#if value === option.id}<CircleCheckIcon
                  fill="var(--foreground)"
                  stroke="var(--background)"
                  aria-label="Selected"
                />{/if}</CommandView.Item
            >
          {/each}
          {#if value && !options.some((o) => o.id === value)}
            <CommandView.Item {value} disabled
              ><CommandView.ItemLabel
                >{value} (saved preference)</CommandView.ItemLabel
              ></CommandView.Item
            >
          {/if}
          {#if allowCustom}<CommandView.Item
              value="Custom model ID"
              onSelect={() => {
                custom = true;
                open = false;
              }}
              ><CommandView.ItemLabel>Custom model ID…</CommandView.ItemLabel
              ></CommandView.Item
            >{/if}
        </CommandView.Group>
      </CommandView.List>
    </CommandView.Root>
  </Popover.Content>
</Popover.Root>
{#if custom}
  <Input
    aria-label="Custom model ID"
    value={value ?? ""}
    maxlength={256}
    {disabled}
    oninput={(event) => {
      value = event.currentTarget.value || null;
      onChange?.();
    }}
  />
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onclick={() => (custom = false)}>Done</Button
  >
{/if}

<style>
  .model-option {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
  }

  :global(.chat-agent-model-trigger) {
    width: 100%;
    min-width: 0;
    justify-content: space-between;
    white-space: normal;
  }
  :global(.chat-agent-model-trigger span) {
    flex: 1 1 auto;
    min-width: 0;
    overflow-wrap: anywhere;
    text-align: center;
  }
  :global(.chat-agent-model-menu) {
    width: min(30rem, calc(100vw - 2rem));
    max-width: calc(100vw - 2rem);
    padding: 0;
  }
</style>
