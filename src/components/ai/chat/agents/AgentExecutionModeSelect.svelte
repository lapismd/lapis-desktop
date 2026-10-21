<!-- SPDX-License-Identifier: Apache-2.0; adapted from JJ Store StoreAgentExecutionMode. -->
<script lang="ts">
  import * as Field from "@lapismd/design-core/shadcn/field";
  import * as Select from "@lapismd/design-core/shadcn/select";
  import type { ExecutionMode } from "../../../../lib/ai/core/agent-profile.ts";
  let {
    id,
    value = $bindable(""),
    options,
    disabled = false,
    loading = false,
  }: {
    id: string;
    value?: string;
    options: ExecutionMode[];
    disabled?: boolean;
    loading?: boolean;
  } = $props();
  const selected = $derived(options.find((o) => o.id === value));
</script>

<Field.Field>
  <Field.Label for={id}>Mode</Field.Label>
  <Select.Root
    type="single"
    bind:value
    disabled={disabled || loading || !options.length}
  >
    <Select.Trigger {id}
      >{selected?.name ??
        (value
          ? `${value} (saved preference)`
          : "Use the reviewed client default")}</Select.Trigger
    >
    <Select.Content
      ><Select.Group>
        <Select.Item value="" label="Use the reviewed client default"
          >Use the reviewed client default</Select.Item
        >
        {#each options as option (option.id)}<Select.Item
            value={option.id}
            label={option.name}>{option.name}</Select.Item
          >{/each}
        {#if value && !selected}<Select.Item {value} disabled
            >{value} (unavailable)</Select.Item
          >{/if}
      </Select.Group></Select.Content
    >
  </Select.Root>
  <Field.Description
    >{loading
      ? "Loading supported modes…"
      : (selected?.description ??
        (options.length
          ? "Default execution mode for this agent. Lapis tool approvals still apply."
          : "This client has not advertised selectable execution modes."))}</Field.Description
  >
</Field.Field>
