<!-- SPDX-License-Identifier: Apache-2.0; adapted from jj-store StoreAgentConfiguration. -->
<script lang="ts">
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
    panelProps,
    active,
    disabled = false,
  }: {
    id: string;
    agent: AcpAgentId;
    model: string | null;
    thinking: AiThinkingLevel | "inherit";
    panelProps: AgentProfileEditorContext;
    active: boolean;
    disabled?: boolean;
  } = $props();
  const labels = { codex: "Codex", cursor: "Cursor", opencode: "OpenCode" };
  const efforts = ["inherit", "off", "low", "medium", "high"] as const;
  const effortLabel = (value: typeof thinking) =>
    value === "inherit"
      ? "Use the chat default"
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
    if (!load) return;
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
    >Agent client</Field.Label
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
      }
    }}
  />
  <Field.Description
    >Uses the installed and admitted client on this device.</Field.Description
  >
</Field.Field>
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
