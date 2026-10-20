<!-- SPDX-License-Identifier: Apache-2.0; composes retained jj-store settings presentation. -->
<script lang="ts">
  import { onMount } from "svelte";
  import * as Field from "@lapismd/design-core/shadcn/field";
  import * as Select from "@lapismd/design-core/shadcn/select";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import GitBranchIcon from "@lucide/svelte/icons/git-branch";
  import HistoryIcon from "@lucide/svelte/icons/history";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import RefreshIcon from "@lucide/svelte/icons/refresh-cw";
  import ClientSettingsCard from "./ClientSettingsCard.svelte";
  import ClientSettingsFooter from "./ClientSettingsFooter.svelte";
  import ClientSettingsEmpty from "./ClientSettingsEmpty.svelte";
  import type { NativeConversationSettingsManagement } from "../../../lib/ai/settings/native-conversation-settings.ts";
  import type { NativeConversationSetupState } from "../../../lib/ai/conversations/native-setup.ts";
  import type { ConversationBackend } from "../../../lib/ai/conversations/backend-port.ts";
  import type { NativeConversationReference } from "../../../lib/ai/conversations/conversation-route.ts";

  let { management }: { management?: NativeConversationSettingsManagement } =
    $props();
  let setupState = $state<NativeConversationSetupState>({
    busy: false,
    closed: false,
  });
  let desired = $state<ConversationBackend>("vault-files"),
    title = $state("");
  const id = $props.id();
  const options = [
    { value: "vault-files", label: "Normal ACP sessions" },
    { value: "jj", label: "Add native JJ history" },
  ];
  const uncertainCreation = $derived(
    Boolean(setupState.creation && !setupState.creation.reference),
  );
  const blocked = $derived(
    setupState.busy ||
      setupState.closed ||
      Boolean(setupState.pendingChoice) ||
      uncertainCreation,
  );
  onMount(() => {
    if (!management) return;
    const setup = management.setup;
    let revision: number | undefined, creation: string | undefined;
    const unsubscribe = setup.subscribe((next) => {
      setupState = next;
      if (next.selection && next.selection.revision !== revision) {
        revision = next.selection.revision;
        desired = next.selection.backend;
      }
      if (next.creation && next.creation.request !== creation) {
        creation = next.creation.request;
        title = next.creation.title;
      }
    });
    if (setup.available) void setup.refresh().catch(() => {});
    return unsubscribe;
  });
  function open(reference: NativeConversationReference | undefined) {
    const owner = management;
    if (reference && owner)
      void owner.openConversation(reference).catch(owner.setup.report);
  }
  function openHistory() {
    const owner = management;
    if (owner) void owner.openHistory().catch(owner.setup.report);
  }
  function create() {
    void management?.setup
      .create(title)
      .then(open)
      .catch(() => {});
  }
  function recover() {
    void management?.setup
      .recoverCreation()
      .then(open)
      .catch(() => {});
  }
</script>

<ClientSettingsCard
  id={`${id}-heading`}
  title="Conversation storage"
  description="Add JJ-backed conversations alongside your normal ACP sessions. Existing chats remain available."
  Icon={GitBranchIcon}
>
  {#if !management?.setup.available}
    <ClientSettingsEmpty
      Icon={GitBranchIcon}
      title="Native history unavailable"
      description="Enable AI in a trusted desktop vault to use its existing JJ history."
    />
  {:else if !setupState.selection && !setupState.error}
    <div
      class="native-setup-fields"
      role="status"
      aria-label="Loading conversation storage"
      aria-busy="true"
    >
      <Skeleton class="native-setup-label" /><Skeleton
        class="native-setup-control"
      />
      <Skeleton class="native-setup-label" /><Skeleton
        class="native-setup-control"
      />
    </div>
  {:else if !setupState.selection}
    <ClientSettingsEmpty
      Icon={GitBranchIcon}
      title="Conversation storage unavailable"
      description="Check again after confirming that native AI and vault history are available."
    />
  {:else}
    <div class="native-setup-fields">
      <Field.FieldGroup>
        <Field.Field>
          <Field.FieldLabel for={`${id}-storage`}
            >Conversation storage</Field.FieldLabel
          >
          <Select.Root
            type="single"
            value={desired}
            disabled={blocked}
            onValueChange={(value) => {
              if (value === "jj" || value === "vault-files") desired = value;
            }}
          >
            <Select.Trigger id={`${id}-storage`}>
              {options.find((option) => option.value === desired)?.label}
            </Select.Trigger>
            <Select.Content
              ><Select.Group
                ><Select.Label>Conversation history</Select.Label>
                {#each options as option (option.value)}<Select.Item
                    value={option.value}
                    label={option.label}>{option.label}</Select.Item
                  >{/each}
              </Select.Group></Select.Content
            >
          </Select.Root>
          <Field.FieldDescription
            >JJ uses this vault's existing history. Changing this choice does
            not move or replace normal ACP sessions.</Field.FieldDescription
          >
        </Field.Field>
      </Field.FieldGroup>
      <div class="native-setup-actions">
        <Button
          size="sm"
          variant="outline"
          disabled={blocked || desired === setupState.selection.backend}
          onclick={() => void management?.setup.choose(desired).catch(() => {})}
          >Apply storage choice</Button
        >
        {#if setupState.selection.backend === "jj"}
          <Button
            size="sm"
            variant="outline"
            disabled={setupState.busy || Boolean(setupState.pendingChoice)}
            onclick={openHistory}
          >
            <HistoryIcon data-icon="inline-start" />Open native history
          </Button>
        {/if}
      </div>
      {#if setupState.pendingChoice}<p role="status">
          Storage choice is unconfirmed. Check its original request before
          continuing.
        </p>{/if}
      {#if setupState.selection.backend === "jj"}
        <Field.FieldGroup>
          <Field.Field>
            <Field.FieldLabel for={`${id}-title`}
              >New native conversation</Field.FieldLabel
            >
            <Input
              id={`${id}-title`}
              bind:value={title}
              disabled={blocked}
              placeholder="Conversation title"
            />
            <Field.FieldDescription
              >Creates a local history entry. An agent runs only after you
              explicitly send a message.</Field.FieldDescription
            >
          </Field.Field>
        </Field.FieldGroup>
        <div class="native-setup-actions">
          <Button
            size="sm"
            variant="outline"
            disabled={blocked || !title.trim()}
            onclick={create}
          >
            <PlusIcon data-icon="inline-start" />Create native conversation
          </Button>
          {#if setupState.creation?.reference}<Button
              size="sm"
              variant="ghost"
              disabled={setupState.busy}
              onclick={() => open(setupState.creation?.reference)}
              >Open created conversation</Button
            >{/if}
          {#if uncertainCreation}<Button
              size="sm"
              variant="outline"
              disabled={setupState.busy}
              onclick={recover}>Check original creation</Button
            >{/if}
        </div>
        {#if uncertainCreation}<p role="status">
            Creation is unconfirmed. Check the original request before creating
            another conversation.
          </p>{/if}
      {/if}
    </div>
  {/if}
  {#if management?.setup.available}<ClientSettingsFooter footer>
      <Button
        size="sm"
        variant="outline"
        disabled={setupState.busy}
        onclick={() => void management?.setup.refresh().catch(() => {})}
      >
        <RefreshIcon data-icon="inline-start" />{setupState.pendingChoice
          ? "Check original choice"
          : "Check storage"}
      </Button>
    </ClientSettingsFooter>{/if}
</ClientSettingsCard>

<style>
  .native-setup-fields {
    display: grid;
    gap: 1rem;
    padding: 1rem;
    min-width: 0;
  }
  .native-setup-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  p {
    margin: 0;
    color: var(--muted-foreground);
    font-size: 0.875rem;
  }
  :global(.native-setup-label) {
    height: 1rem;
    width: 45%;
  }
  :global(.native-setup-control) {
    height: 2.25rem;
    width: 100%;
  }
</style>
