<!-- Adapted from JJ Store's settings card/footer and StoreAgentEnvironmentEditor key field. Apache-2.0. -->
<script lang="ts">
  import ClientSettingsCard from "./ClientSettingsCard.svelte";
  import ClientSettingsFooter from "./ClientSettingsFooter.svelte";
  import ClientSettingsEmpty from "./ClientSettingsEmpty.svelte";
  import * as Field from "@lapismd/design-core/shadcn/field";
  import * as Select from "@lapismd/design-core/shadcn/select";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import KeyRoundIcon from "@lucide/svelte/icons/key-round";
  import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
  import type { AiProviders } from "../../../lib/ai/settings/providers.svelte.ts";
  let { management }: { management: AiProviders } = $props();
  const id = $props.id();
  const selected = $derived(
    management.value?.providers.find((p) => p.id === management.draft.provider),
  );
  const blocked = $derived(management.busy || management.pending);
  const needsModel = $derived(
    !["local", "paired"].includes(management.draft.provider),
  );
  $effect(() => {
    if (!management.value && !management.busy && !management.failed)
      void management.refresh();
  });
</script>

<div class="provider-settings">
  <ClientSettingsCard
    id={`${id}-card`}
    title="Lapis provider"
    description="Configure the bundled agent on this device. External agents keep their own sign-in."
    Icon={KeyRoundIcon}
  >
    {#if management.value}
      <Field.Group class="provider-fields">
        <Field.Field class="provider-row">
          <Field.Label for={`${id}-provider`}>Provider</Field.Label>
          <Select.Root
            type="single"
            value={management.draft.provider}
            disabled={blocked}
            onValueChange={(provider) =>
              management.configure({ provider, endpoint: null, model: null })}
          >
            <Select.Trigger
              id={`${id}-provider`}
              aria-label={`Provider: ${selected?.label ?? "Choose a provider"}`}
              >{selected?.label ?? "Choose a provider"}</Select.Trigger
            >
            <Select.Content aria-label="AI providers"
              ><Select.Group>
                {#each management.value.providers as provider (provider.id)}<Select.Item
                    value={provider.id}>{provider.label}</Select.Item
                  >{/each}
              </Select.Group></Select.Content
            >
          </Select.Root>
        </Field.Field>
        {#if selected?.endpoint_required || selected?.default_endpoint}<Field.Field
            class="provider-row"
          >
            <Field.Label for={`${id}-endpoint`}>Endpoint</Field.Label>
            <Input
              id={`${id}-endpoint`}
              disabled={blocked}
              value={management.draft.endpoint ?? ""}
              placeholder={selected?.default_endpoint ??
                "https://provider.example/v1"}
              oninput={(event) =>
                management.configure({
                  endpoint: event.currentTarget.value.trim() || null,
                })}
            />
          </Field.Field>
        {/if}
        {#if needsModel}
          <Field.Field class="provider-row">
            <div>
              <Field.Label for={`${id}-model`}>Default model</Field.Label>
              <Field.Description id={`${id}-model-help`}>
                Required. Enter an exact model ID. Supported providers discover
                more models in the chat picker.
              </Field.Description>
            </div>
            <Input
              id={`${id}-model`}
              required
              aria-describedby={`${id}-model-help`}
              disabled={blocked}
              value={management.draft.model ?? ""}
              placeholder="Enter a model ID"
              oninput={(event) =>
                management.configure({
                  model: event.currentTarget.value.trim() || null,
                })}
            />
          </Field.Field>
        {/if}
        {#if selected?.credential_env}<Field.Field class="provider-row">
            <div>
              <Field.Label for={`${id}-key`}>API key</Field.Label
              ><Field.Description
                >{management.value.credentialAvailable
                  ? "A key is saved in this device’s Keychain."
                  : "Stored only in this device’s Keychain."}</Field.Description
              >
            </div>
            <Input
              id={`${id}-key`}
              type="password"
              autocomplete="new-password"
              disabled={blocked || !management.value.keychainSupported}
              bind:value={management.secret}
              placeholder="Enter a key or a replacement"
            />
          </Field.Field>
        {/if}
      </Field.Group>
    {:else if management.failed}
      <ClientSettingsEmpty
        Icon={KeyRoundIcon}
        title="Provider settings unavailable"
        description="Check again to load the saved provider settings."
      />
    {:else}
      <div
        class="provider-loading"
        role="status"
        aria-busy={management.busy}
        aria-label="Loading provider settings"
      >
        {#each [0, 1, 2, 3] as row (row)}<Skeleton
            style="height:2.5rem"
          />{/each}
      </div>
    {/if}
    <ClientSettingsFooter footer>
      {#snippet description()}<p>
          {management.pending
            ? "A settings request needs confirmation. Check again or retry that request."
            : "New sessions use these settings. Keys are never included in vault backups."}
        </p>{/snippet}
      <Button
        variant="ghost"
        size="sm"
        disabled={management.busy}
        onclick={() => void management.refresh()}
        ><RefreshCwIcon data-icon="inline-start" />Check again</Button
      >
      {#if management.superseded}<Button
          variant="outline"
          size="sm"
          disabled={management.busy}
          onclick={() => management.useSaved()}>Use saved settings</Button
        >{/if}
      {#if management.value?.credentialAvailable && !management.pending && !management.dirty}<Button
          variant="outline"
          size="sm"
          disabled={management.busy}
          onclick={() => void management.save(true)}>Remove key</Button
        >{/if}
      <Button
        size="sm"
        disabled={management.busy ||
          !management.value ||
          !management.draft.provider ||
          (!management.pending &&
            needsModel &&
            !management.draft.model?.trim())}
        onclick={() => void management.save()}
        >{management.pending ? "Retry save" : "Save provider"}</Button
      >
    </ClientSettingsFooter>
  </ClientSettingsCard>
</div>

<style>
  .provider-settings {
    min-width: 0;
  }
  .provider-settings :global(.provider-fields) {
    gap: 0;
  }
  .provider-settings :global(.provider-row) {
    display: grid;
    grid-template-columns: minmax(8rem, 1fr) minmax(0, 2fr);
    gap: 1rem;
    align-items: center;
    margin: 0;
    padding: 0.8rem 1rem;
    border-block-end: 1px solid var(--border);
  }
  .provider-loading {
    display: grid;
    gap: 0.75rem;
    padding: 1rem;
  }
  p {
    margin: 0;
    font-size: 0.8rem;
    color: var(--muted-foreground);
  }
  @container (max-width: 30rem) {
    .provider-settings :global(.provider-row) {
      grid-template-columns: minmax(0, 1fr);
      gap: 0.5rem;
    }
  }
</style>
