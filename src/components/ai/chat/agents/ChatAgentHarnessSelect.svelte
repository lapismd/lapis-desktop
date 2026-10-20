<!-- SPDX-License-Identifier: Apache-2.0; copied/adapted from jj-store StoreAgentHarnessSelect. -->
<script lang="ts">
  import * as Select from "@lapismd/design-core/shadcn/select";
  import HarnessIcon from "./ChatAgentIcon.svelte";
  let {
    id,
    value,
    options,
    disabled = false,
    onValueChange,
  }: {
    id: string;
    value: string;
    options: readonly { id: string; label: string }[];
    disabled?: boolean;
    onValueChange: (value: string) => void;
  } = $props();
</script>

<Select.Root
  type="single"
  {value}
  {disabled}
  onValueChange={(next) => {
    if (options.some((option) => option.id === next)) onValueChange(next);
  }}
>
  <Select.Trigger {id} class="chat-agent-client-trigger">
    <span class="chat-agent-client-choice">
      <HarnessIcon runtimeAgent={value} />
      <span
        >{options.find((option) => option.id === value)?.label ?? value}</span
      >
    </span>
  </Select.Trigger>
  <Select.Content aria-labelledby={`${id}-label`}>
    <Select.Group>
      {#each options as option (option.id)}
        <Select.Item value={option.id} label={option.label}>
          <span class="chat-agent-client-choice">
            <HarnessIcon runtimeAgent={option.id} />
            <span>{option.label}</span>
          </span>
        </Select.Item>
      {/each}
    </Select.Group>
  </Select.Content>
</Select.Root>

<style>
  :global(.chat-agent-client-trigger) {
    width: 100%;
    min-width: 0;
  }
  .chat-agent-client-choice {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }
  .chat-agent-client-choice :global(svg) {
    width: 1em;
    height: 1em;
    flex-shrink: 0;
  }
</style>
