<!-- SPDX-License-Identifier: Apache-2.0; copied/adapted from jj-store CommunityAgentEditorDialog. -->
<script lang="ts">
  import { untrack } from "svelte";
  import { DialogFrame } from "@lapismd/design-core/forms/dialog";
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import { AvatarPicker } from "@lapismd/design-core/forms/avatar-picker";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { MarkdownComposer } from "@lapismd/design-core/chat";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import * as Field from "@lapismd/design-core/shadcn/field";
  import ChatAgentConfiguration from "./agents/ChatAgentConfiguration.svelte";
  import ChatAgentIcon from "./agents/ChatAgentIcon.svelte";
  import { readAgentAvatarImage } from "./agents/avatar-image.ts";
  import type { AgentProfileEditorContext } from "../../../lib/ai/settings/agent-profile-editor.ts";
  import type { AiChatController } from "../../../lib/ai/chat/chat-controller.svelte.ts";
  import type { AgentRecipientOption } from "../../../lib/ai/conversations/recipients.ts";
  import type { AiThinkingLevel } from "../../../lib/ai/core/models.ts";
  import { validateAgentParticipants } from "../../../lib/ai/settings/participants.ts";
  import {
    normalizeAcpAgent,
    type AcpAgentId,
  } from "../../../lib/ai/settings/acp-agents.ts";
  let {
    open = $bindable(false),
    panelProps,
    controller,
    participant,
    busy = false,
  }: {
    open?: boolean;
    panelProps: AgentProfileEditorContext;
    controller?: Pick<AiChatController, "busy">;
    participant?: AgentRecipientOption;
    busy?: boolean;
  } = $props();
  let label = $state(""),
    saving = $state(false),
    draftId = $state("");
  let agent = $state<AcpAgentId>("codex"),
    model = $state<string | null>(null);
  let description = $state(""),
    instructions = $state(""),
    executionMode = $state("");
  let thinking = $state<AiThinkingLevel | "inherit">("inherit");
  let avatar = $state(""),
    avatarBackground = $state("#6e56cf"),
    avatarUploads = $state(0);
  const labels = { codex: "Codex", cursor: "Cursor", opencode: "OpenCode" };
  const editorId = $props.id();
  const disabled = $derived(
    saving ||
      busy ||
      Boolean(controller?.busy) ||
      Boolean(panelProps.initializing),
  );
  $effect(() => {
    if (!open) return;
    const initial = participant;
    untrack(() => {
      label = initial?.label ?? "";
      description = initial?.description ?? "";
      instructions = initial?.instructions ?? "";
      executionMode = initial?.executionMode ?? "";
      agent =
        initial?.agent ?? normalizeAcpAgent(panelProps.settings?.acpAgent);
      model = initial?.model ?? null;
      thinking = initial?.thinking ?? "inherit";
      avatar = initial?.avatar ?? "";
      avatarBackground = initial?.avatarBackground ?? "#6e56cf";
      draftId = initial?.id ?? `participant-${crypto.randomUUID()}`;
    });
  });
  async function save(event: SubmitEvent) {
    event.preventDefault();
    if (
      disabled ||
      avatarUploads ||
      !label.trim() ||
      !panelProps.onSettingsChange
    )
      return;
    saving = true;
    try {
      const defaultAgent = normalizeAcpAgent(panelProps.settings?.acpAgent);
      const current = panelProps.settings?.agentParticipants ?? [
        { id: defaultAgent, label: labels[defaultAgent], agent: defaultAgent },
      ];
      if (participant && !current.some((p) => p.id === participant.id))
        throw new Error(
          "This agent is no longer available. Your draft is retained.",
        );
      const value = {
        id: draftId,
        label: label.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(instructions.trim() ? { instructions: instructions.trim() } : {}),
        ...(executionMode ? { executionMode } : {}),
        agent,
        ...(model?.trim() ? { model: model.trim() } : {}),
        ...(thinking !== "inherit" ? { thinking } : {}),
        ...(avatar ? { avatar } : {}),
        avatarBackground,
      };
      const participants = validateAgentParticipants(
        current.some((p) => p.id === draftId)
          ? current.map((p) => (p.id === draftId ? value : p))
          : [...current, value],
      );
      await panelProps.onSettingsChange({ agentParticipants: participants });
      await panelProps.app?.notifications.clear("ai-participant-save");
      open = false;
    } catch (error) {
      panelProps.app?.notifications.notify({
        id: "ai-participant-save",
        title: "AI",
        source: "ai",
        severity: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      saving = false;
    }
  }
</script>

<Dialog.Root bind:open>
  <DialogFrame
    title={participant ? "Edit agent" : "Add agent participant"}
    description="Manage a named agent and its runtime defaults. Choose it with @ or the Agents picker."
    descriptionHidden
    size="large"
    surface="inset"
    busy={saving}
    closeLabel="Close agent editor"
    onInteractOutside={(event) => {
      if (saving) event.preventDefault();
    }}
    onEscapeKeydown={(event) => {
      if (saving) event.preventDefault();
    }}
  >
    {#snippet sidebar()}
      <div class="agent-editor-sidebar">
        <AvatarPicker
          bind:value={avatar}
          bind:background={avatarBackground}
          name={label || "Agent"}
          label="Edit agent avatar"
          size="2xl"
          shape="rounded"
          {disabled}
          onUploadImage={async (file, signal) => {
            avatarUploads++;
            try {
              return await readAgentAvatarImage(file, signal);
            } finally {
              avatarUploads--;
            }
          }}
        />
        <strong>{label.trim() || "New agent"}</strong>
        <span class="agent-editor-client"
          ><ChatAgentIcon runtimeAgent={agent} />{labels[agent]}</span
        >
        <p>Available to chats in this vault.</p>
      </div>
    {/snippet}
    <form
      id={`${editorId}-form`}
      aria-label="Agent configuration"
      onsubmit={save}
    >
      <Field.Group>
        <Field.Field>
          <Field.Label for={`${editorId}-name`}>Participant name</Field.Label>
          <Input
            id={`${editorId}-name`}
            bind:value={label}
            maxlength={80}
            required
            {disabled}
          />
        </Field.Field>
        <Field.Field>
          <Field.Label>Description <span>Optional</span></Field.Label>
          <MarkdownComposer
            bind:value={description}
            label="Description composer"
            inputLabel="Description"
            placeholder="What this agent does, in a sentence"
            showSendButton={false}
            showHint={false}
            submitOnEnter={false}
            onSubmit={() => {}}
            style="--ui-markdown-composer-min-height: 4rem"
            {disabled}
          />
          <Field.Description>Up to 280 characters.</Field.Description>
        </Field.Field>
        <Field.Field>
          <Field.Label>Agent instructions</Field.Label>
          <MarkdownComposer
            bind:value={instructions}
            label="Agent instructions composer"
            inputLabel="Agent instructions"
            placeholder="Describe how this agent should work."
            showSendButton={false}
            showHint={false}
            submitOnEnter={false}
            onSubmit={() => {}}
            style="--ui-markdown-composer-min-height: 7rem"
            {disabled}
          />
          <Field.Description
            >Used with the first prompt of new sessions. Existing sessions
            retain their original instructions.</Field.Description
          >
        </Field.Field>
        <ChatAgentConfiguration
          id={editorId}
          bind:agent
          bind:model
          bind:thinking
          bind:executionMode
          {panelProps}
          active={open}
          {disabled}
        />
        <Field.Description
          >Saving applies to future messages. Queued messages keep their
          captured settings.</Field.Description
        >
      </Field.Group>
    </form>
    {#snippet footer()}
      <Button
        type="button"
        variant="outline"
        disabled={saving}
        onclick={() => (open = false)}>Cancel</Button
      >
      <Button
        type="submit"
        form={`${editorId}-form`}
        disabled={disabled ||
          !!avatarUploads ||
          !label.trim() ||
          !panelProps.onSettingsChange}
      >
        {saving ? "Saving…" : participant ? "Save agent" : "Add participant"}
      </Button>
    {/snippet}
  </DialogFrame>
</Dialog.Root>

<style>
  .agent-editor-sidebar {
    display: grid;
    align-content: start;
    justify-items: center;
    gap: 0.875rem;
    text-align: center;
    overflow-wrap: anywhere;
  }
  .agent-editor-sidebar strong {
    max-width: 100%;
  }
  .agent-editor-client {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--muted-foreground);
  }
  .agent-editor-client :global(svg) {
    width: 1rem;
    height: 1rem;
  }
  .agent-editor-sidebar p {
    margin: 0;
    color: var(--muted-foreground);
    font-size: 0.8125rem;
  }
</style>
