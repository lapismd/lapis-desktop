<!-- Buzz EditAgentProviderModelFields presentation, adapted to public Design Core. -->
<script lang="ts">
  import * as Field from "@lapismd/design-core/shadcn/field";
  import * as Select from "@lapismd/design-core/shadcn/select";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import ChatAgentModelSelect from "./ChatAgentModelSelect.svelte";
  import type { AiProviders } from "../../../../lib/ai/settings/providers.svelte.ts";
  import type { AgentProfileEditorContext } from "../../../../lib/ai/settings/agent-profile-editor.ts";
  let {
    management,
    panelProps,
    profileId,
    disabled = false,
  }: {
    management: AiProviders;
    panelProps: AgentProfileEditorContext;
    profileId?: string;
    disabled?: boolean;
  } = $props();
  const id = $props.id();
  const provider = $derived(
    management.value?.providers.find((p) => p.id === management.draft.provider),
  );
  const blocked = $derived(disabled || management.busy || management.pending);
  const managed = $derived(
    ["local", "paired"].includes(management.draft.provider),
  );
  let models = $state<{ id: string; name: string }[]>([]);
  $effect(() => {
    if (!management.value && !management.busy && !management.failed)
      void management.refresh();
  });
  $effect(() => {
    const revision = management.value?.revision;
    if (!revision || management.dirty || management.pending) {
      models = [];
      return;
    }
    let disposed = false;
    void panelProps
      .loadModels?.("local", "acp", profileId)
      .then((values) => {
        if (!disposed)
          models = values.map((m) => ({
            id: m.model,
            name: m.displayName ?? m.model,
          }));
      })
      .catch((error) => {
        if (!disposed) {
          models = [];
          panelProps.app?.notifications.notify({
            id: "ai-agent-provider-models",
            source: "ai",
            title: "Agent models",
            severity: "error",
            message: error instanceof Error ? error.message : String(error),
          });
        }
      });
    return () => {
      disposed = true;
    };
  });
</script>

{#if management.value}
  <Field.Field>
    <Field.Label for={`${id}-provider`}>LLM provider</Field.Label>
    <Select.Root
      type="single"
      value={management.draft.provider}
      disabled={blocked}
      onValueChange={(provider) =>
        management.configure({ provider, endpoint: null, model: null })}
    >
      <Select.Trigger
        id={`${id}-provider`}
        aria-label={`LLM provider: ${provider?.label ?? "Choose a provider"}`}
        >{provider?.label ?? "Choose a provider"}</Select.Trigger
      >
      <Select.Content aria-label="LLM providers"
        ><Select.Group>
          {#each management.value.providers as p (p.id)}<Select.Item
              value={p.id}>{p.label}</Select.Item
            >{/each}
        </Select.Group></Select.Content
      >
    </Select.Root>
  </Field.Field>
  {#if provider?.endpoint_required || provider?.default_endpoint}
    <Field.Field>
      <Field.Label for={`${id}-endpoint`}>Endpoint</Field.Label>
      <Input
        id={`${id}-endpoint`}
        value={management.draft.endpoint ?? ""}
        disabled={blocked}
        required={provider.endpoint_required}
        placeholder={provider.default_endpoint ?? "https://provider.example/v1"}
        oninput={(e) =>
          management.configure({
            endpoint: e.currentTarget.value.trim() || null,
          })}
      />
    </Field.Field>
  {/if}
  {#if provider?.credential_env}
    <Field.Field>
      <Field.Label for={`${id}-key`}>API key</Field.Label>
      <Input
        id={`${id}-key`}
        type="password"
        autocomplete="new-password"
        bind:value={management.secret}
        disabled={blocked || !management.value.keychainSupported}
        placeholder={management.value.credentialAvailable
          ? "Saved in Keychain; enter to replace"
          : "Enter an API key"}
      />
      <Field.Description
        >Stored in this device’s Keychain for this agent. Never saved in the
        vault.</Field.Description
      >
      {#if management.value.credentialAvailable && !management.dirty && !management.pending}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={blocked}
          onclick={() => void management.save(true)}>Remove key</Button
        >
      {/if}
    </Field.Field>
  {/if}
  {#if provider && !managed}
    <Field.Field>
      <Field.Label for={`${id}-model`}>Model</Field.Label>
      <ChatAgentModelSelect
        id={`${id}-model`}
        bind:value={
          () => management.draft.model,
          (model) => management.configure({ model: model ?? null })
        }
        options={models}
        disabled={blocked}
        allowCustom
        defaultLabel="Choose a model"
      />
      <Field.Description
        >Required. Choose a discovered model or enter its exact ID. Discovery
        uses this agent’s saved provider.</Field.Description
      >
    </Field.Field>
  {:else if managed}
    <Field.Description
      >Uses the model running on the selected compute host. Manage downloads,
      serving and Max VRAM in Compute settings.</Field.Description
    >
  {/if}
  {#if management.pending}
    <Field.Description
      >A provider save needs confirmation. Check again or retry saving this
      agent.</Field.Description
    >
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={management.busy}
      onclick={() => void management.refresh()}>Check provider save</Button
    >
    {#if management.superseded}<Button
        type="button"
        variant="outline"
        size="sm"
        onclick={() => management.useSaved()}
        >Use saved provider settings</Button
      >{/if}
  {/if}
{:else if management.failed}
  <Field.Description
    >Provider settings unavailable. Your agent draft is retained.</Field.Description
  >
  <Button
    type="button"
    variant="outline"
    disabled={management.busy}
    onclick={() => void management.refresh()}>Retry provider settings</Button
  >
{:else}<div role="status" aria-label="Loading agent provider">
    <Skeleton style="height:8rem;width:100%" />
  </div>{/if}
