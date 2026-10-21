<!-- SPDX-License-Identifier: Apache-2.0; adapted from jj-store StoreAgentConfiguration. -->
<script lang="ts">
  import AgentProviderFields from "./AgentProviderFields.svelte";
  import type { AiProviders } from "../../../../lib/ai/settings/providers.svelte.ts";
  import AgentExecutionModeSelect from "./AgentExecutionModeSelect.svelte";
  import AgentApprovalPolicySelect from "./AgentApprovalPolicySelect.svelte";
  import type { ApprovalPolicy } from "../../../../lib/ai/core/approval-policy.ts";
  import type { ExecutionMode } from "../../../../lib/ai/core/agent-profile.ts";
  import * as Field from "@lapismd/design-core/shadcn/field";
  import * as Select from "@lapismd/design-core/shadcn/select";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import ChatAgentHarnessSelect from "./ChatAgentHarnessSelect.svelte";
  import ChatAgentModelSelect from "./ChatAgentModelSelect.svelte";
  import {
    ACP_AGENT_IDS,
    isAcpAgentId,
    catalogModelsForAgent,
    type AcpAgentId,
  } from "../../../../lib/ai/settings/acp-agents.ts";
  import type {
    AiThinkingLevel,
    ModelRef,
  } from "../../../../lib/ai/core/models.ts";
  import type { AgentProfileEditorContext } from "../../../../lib/ai/settings/agent-profile-editor.ts";

  let {
    id,
    agent = $bindable("codex"),
    model = $bindable(null),
    thinking = $bindable("inherit"),
    executionMode = $bindable(""),
    approvalPolicy = $bindable(""),
    panelProps,
    providerSettings,
    providerProfileId,
    active,
    disabled = false,
  }: {
    id: string;
    agent: AcpAgentId;
    model: string | null;
    thinking: AiThinkingLevel | "inherit";
    executionMode?: string;
    approvalPolicy?: ApprovalPolicy | "";
    panelProps: AgentProfileEditorContext;
    providerSettings?: AiProviders;
    providerProfileId?: string;
    active: boolean;
    disabled?: boolean;
  } = $props();
  let modes = $state<ExecutionMode[]>([]),
    modesLoading = $state(false);
  $effect(() => {
    const client = agent,
      load = panelProps.loadExecutionModes;
    if (!active) return;
    modes = [];
    modesLoading = false;
    if (
      !load ||
      (client === "local" &&
        (!providerSettings?.value?.revision ||
          providerSettings.dirty ||
          providerSettings.pending))
    )
      return;
    let disposed = false;
    modesLoading = true;
    void load(client, "acp", client === "local" ? providerProfileId : undefined)
      .then((values) => {
        if (!disposed) modes = values;
      })
      .catch((error) => {
        if (!disposed)
          panelProps.app?.notifications.notify({
            id: "ai-agent-editor-permissions",
            source: "ai",
            severity: "error",
            title: "Agent modes",
            message: error instanceof Error ? error.message : String(error),
          });
      })
      .finally(() => {
        if (!disposed) modesLoading = false;
      });
    return () => {
      disposed = true;
    };
  });
  const labels = {
    codex: "Codex",
    cursor: "Cursor",
    opencode: "OpenCode",
    local: "Lapis AI",
  };
  const efforts = [
    "inherit",
    "default",
    "off",
    "low",
    "medium",
    "high",
  ] as const;
  const effortLabel = (value: typeof thinking) =>
    value === "inherit"
      ? "Use the chat default"
      : value === "default"
        ? "Provider default"
        : value[0]!.toUpperCase() + value.slice(1);
  let models = $state<ModelRef[]>([]),
    loading = $state(false);
  const options = $derived(
    models.map((m) => ({ id: m.model, name: m.displayName ?? m.model })),
  );
  $effect(() => {
    const client = agent,
      load = panelProps.loadModels;
    if (!active) return;
    models = catalogModelsForAgent(client, panelProps.models ?? []);
    loading = false;
    if (!load || client === "local") return;
    let disposed = false;
    loading = true;
    void Promise.resolve()
      .then(() => load(client, "acp"))
      .then((result) => {
        if (!disposed) models = catalogModelsForAgent(client, result);
      })
      .catch((error: unknown) => {
        if (!disposed)
          panelProps.app?.notifications.notify({
            id: "ai-agent-editor-models",
            source: "ai",
            severity: "error",
            title: "Agent models",
            message: error instanceof Error ? error.message : String(error),
          });
      })
      .finally(() => {
        if (!disposed) loading = false;
      });
    return () => {
      disposed = true;
    };
  });
</script>

<Field.Field>
  <Field.Label id={`${id}-client-label`} for={`${id}-client`}
    >Agent harness</Field.Label
  >
  <ChatAgentHarnessSelect
    id={`${id}-client`}
    value={agent}
    {disabled}
    options={ACP_AGENT_IDS.map((value) => ({
      id: value,
      label: labels[value],
    }))}
    onValueChange={(next) => {
      if (isAcpAgentId(next) && next !== agent) {
        agent = next;
        model = null;
        thinking = "inherit";
        executionMode = "";
      }
    }}
  />
  <Field.Description
    >Uses the installed and admitted client on this device.</Field.Description
  >
</Field.Field>
{#if agent === "local" && providerSettings}
  <AgentProviderFields
    management={providerSettings}
    {panelProps}
    profileId={providerProfileId}
    {disabled}
  />
{:else}
  <Field.Field>
    <Field.Label for={`${id}-model`}>Model</Field.Label>
    {#if loading}<div
        class="model-loading"
        role="status"
        aria-label="Loading models"
      >
        <Skeleton class="model-skeleton" />
      </div>
    {:else}<ChatAgentModelSelect
        id={`${id}-model`}
        bind:value={model}
        {options}
        {disabled}
        allowCustom
        defaultLabel="Use the chat default"
      />{/if}
    <Field.Description
      >Leave the model and effort at their defaults to follow the chat.</Field.Description
    >
  </Field.Field>
{/if}
<Field.Field>
  <Field.Label for={`${id}-effort`}>Effort</Field.Label>
  <Select.Root type="single" bind:value={thinking} {disabled}>
    <Select.Trigger id={`${id}-effort`}>{effortLabel(thinking)}</Select.Trigger>
    <Select.Content
      ><Select.Group>
        {#each efforts as value}<Select.Item {value} label={effortLabel(value)}
            >{effortLabel(value)}</Select.Item
          >{/each}
      </Select.Group></Select.Content
    >
  </Select.Root>
</Field.Field>

<AgentExecutionModeSelect
  id={`${id}-permissions`}
  bind:value={executionMode}
  options={modes}
  loading={modesLoading}
  {disabled}
/>
<AgentApprovalPolicySelect
  id={`${id}-approvals`}
  bind:value={approvalPolicy}
  {disabled}
/>

<style>
  .model-loading {
    display: flex;
    min-height: 2.25rem;
  }
  :global(.model-skeleton) {
    width: 100%;
    height: 2.25rem;
  }
</style>
