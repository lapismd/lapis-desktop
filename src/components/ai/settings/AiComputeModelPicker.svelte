<!-- Copied/adapted from JJ Store StoreComputeModelPicker.svelte; Apache-2.0. -->
<script lang="ts">
  import { tick } from "svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import CheckIcon from "@lucide/svelte/icons/check";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import {
    computeModelChoices,
    type ComputeModel,
    modelMemoryBudget,
  } from "../../../lib/ai/settings/compute-model-catalog.ts";
  import AiComputeModelMetadata from "./AiComputeModelMetadata.svelte";
  let {
    id,
    models,
    hardware,
    memoryLimit,
    disabled = false,
    value,
    onValueChange,
  }: {
    id: string;
    models: readonly ComputeModel[];
    hardware: unknown;
    memoryLimit: unknown;
    disabled?: boolean;
    value: string | null;
    onValueChange: (model: string) => void;
  } = $props();
  let open = $state(false);
  let trigger = $state<HTMLButtonElement>(null!);
  const rows = $derived(
    computeModelChoices(models, hardware, memoryLimit, value),
  );
  const selected = $derived(rows.find((row) => row.id === value));
  const budget = $derived(modelMemoryBudget(hardware, memoryLimit));
  const note = $derived(
    budget === undefined
      ? "Machine memory unavailable; fit is unknown."
      : `Estimated fit uses ${budget.toFixed(1)} GB: 70% of host RAM, capped by your memory limit. Runtime and context need additional memory; GPU capacity is not measured.`,
  );
  async function select(model: string) {
    onValueChange(model);
    open = false;
    await tick();
    trigger?.focus();
  }
</script>

<div class="compute-model-picker">
  <Popover.Root bind:open>
    <Popover.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          {id}
          bind:ref={trigger}
          variant="outline"
          {disabled}
          class="compute-model-picker__trigger"
          role="combobox"
          aria-label="Model"
          aria-expanded={open}
        >
          <span class="compute-model-picker__selection">
            <span class="compute-model-picker__name"
              >{selected?.name ?? "Choose a model"}</span
            >
            {#if selected}<AiComputeModelMetadata model={selected} />{/if}
          </span>
          <ChevronDownIcon aria-hidden="true" />
        </Button>
      {/snippet}
    </Popover.Trigger>
    <Popover.Content
      align="end"
      class="compute-model-picker__menu"
      style="--ui-popover-width: max(var(--bits-popover-anchor-width), min(42rem, calc(100vw - 2rem))); --ui-popover-padding: 0; --ui-command-view-list-max-height: min(24rem, 50dvh)"
    >
      <CommandView.Root label="Search local models" loop>
        <CommandView.Input
          aria-label="Search local models"
          placeholder="Search models…"
        />
        <CommandView.List>
          <CommandView.Empty>No matching models.</CommandView.Empty>
          <CommandView.Group heading="Models">
            {#each rows as model (model.id)}
              <CommandView.Item
                value={model.id}
                keywords={[
                  model.name,
                  model.description,
                  model.fit,
                  model.installed ? "Installed" : "",
                  model.recommended ? "Recommended" : "",
                ]}
                {disabled}
                data-active={value === model.id ? "" : undefined}
                onSelect={() => select(model.id)}
              >
                <CommandView.ItemLabel>
                  <span class="compute-model-picker__option">
                    <span class="compute-model-picker__name">{model.name}</span>
                    <AiComputeModelMetadata {model} />
                    <span class="compute-model-picker__description"
                      >{model.description}</span
                    >
                  </span>
                </CommandView.ItemLabel>
                {#if value === model.id}<CommandView.Shortcut
                    ><CheckIcon aria-hidden="true" /></CommandView.Shortcut
                  >{/if}
              </CommandView.Item>
            {/each}
          </CommandView.Group>
        </CommandView.List>
        <CommandView.Footer
          ><p class="compute-model-picker__note">
            {note} Downloads require Download model.
          </p></CommandView.Footer
        >
      </CommandView.Root>
    </Popover.Content>
  </Popover.Root>
</div>

<style>
  .compute-model-picker {
    min-width: 0;
    width: 100%;
  }
  :global(.compute-model-picker__trigger) {
    width: 100%;
    height: auto;
    min-height: 2.25rem;
    justify-content: space-between;
    text-align: left;
    white-space: normal;
  }
  .compute-model-picker__selection,
  .compute-model-picker__option {
    display: grid;
    gap: 0.25rem;
    min-width: 0;
  }
  .compute-model-picker__name {
    overflow-wrap: anywhere;
  }
  .compute-model-picker__description,
  .compute-model-picker__note {
    color: var(--muted-foreground);
    font-size: 0.8rem;
    white-space: normal;
  }
  .compute-model-picker__note {
    margin: 0;
  }
</style>
