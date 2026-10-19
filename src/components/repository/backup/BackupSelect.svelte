<script lang="ts" generics="T extends string | null">
  // Adapted from jj-store StoreSettingsSelect.svelte (Apache-2.0).
  import * as Select from "@lapismd/design-core/shadcn/select";
  let {
    id,
    value = $bindable(),
    options,
    disabled = false,
    "aria-label": ariaLabel,
    onValueChange,
  }: {
    id?: string;
    value: T;
    options: readonly { value: T; label: string; disabled?: boolean }[];
    disabled?: boolean;
    "aria-label"?: string;
    onValueChange?: (value: T) => void;
  } = $props();
  // Encode null/default choices without reserving a domain value.
  const selected = $derived(
    options.findIndex((option) => option.value === value),
  );
  const display = $derived(
    options[selected]?.label ?? value ?? "Choose an option",
  );
</script>

<Select.Root
  type="single"
  value={selected < 0 ? "" : String(selected)}
  {disabled}
  onValueChange={(next) => {
    const option = next === "" ? undefined : options[Number(next)];
    if (!option || option.disabled) return;
    value = option.value;
    onValueChange?.(value);
  }}
>
  <Select.Trigger
    {id}
    aria-label={ariaLabel ? `${ariaLabel}: ${display}` : undefined}
    style="width:100%"
  >
    <span class="selected-label">{display}</span>
  </Select.Trigger>
  <Select.Content
    aria-label={ariaLabel}
    aria-labelledby={ariaLabel ? undefined : id ? `${id}-label` : undefined}
  >
    <Select.Group>
      {#each options as option, index (option.value)}
        <Select.Item
          value={String(index)}
          label={option.label}
          disabled={option.disabled}
        >
          {option.label}
        </Select.Item>
      {/each}
    </Select.Group>
  </Select.Content>
</Select.Root>

<style>
  .selected-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
