<script lang="ts">
  import * as Field from "@lapismd/design-core/shadcn/field";
  import * as Select from "@lapismd/design-core/shadcn/select";
  import {
    APPROVAL_POLICIES,
    type ApprovalPolicy,
  } from "../../../../lib/ai/core/approval-policy.ts";
  let {
    id,
    value = $bindable(""),
    disabled = false,
  }: { id: string; value?: ApprovalPolicy | ""; disabled?: boolean } = $props();
</script>

<Field.Field>
  <Field.Label for={id}>Action approvals</Field.Label>
  <Select.Root type="single" bind:value {disabled}>
    <Select.Trigger {id}
      >{APPROVAL_POLICIES.find((p) => p.value === value)?.label ??
        "Use global default"}</Select.Trigger
    >
    <Select.Content
      ><Select.Group>
        <Select.Item value="" label="Use global default"
          >Use global default</Select.Item
        >
        {#each APPROVAL_POLICIES as option}<Select.Item
            value={option.value}
            label={option.label}>{option.label}</Select.Item
          >{/each}
      </Select.Group></Select.Content
    >
  </Select.Root>
  <Field.Description
    >Override the footer’s global default for this agent. Auto approval answers
    offered one-time permissions; app and client restrictions still apply.</Field.Description
  >
</Field.Field>
