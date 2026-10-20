<script lang="ts">
  // Copied/adapted from jj-store StoreAgentPicker and StoreRepositoryPicker.
  import { Avatar } from "@lapismd/design-core/shadcn/avatar";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import ChatMentionButton from "./ChatMentionButton.svelte";
  import CheckIcon from "@lucide/svelte/icons/check";
  import ChatPeopleOptions from "./ChatPeopleOptions.svelte";
  import ChatMentionPreference from "./ChatMentionPreference.svelte";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import SettingsIcon from "@lucide/svelte/icons/settings-2";
  import XIcon from "@lucide/svelte/icons/x";
  import ChatParticipantDialog from "./ChatParticipantDialog.svelte";
  import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
  import type { AgentProfileEditorContext } from "../../../lib/ai/settings/agent-profile-editor.ts";
  import type { AgentRecipientOption } from "../../../lib/ai/conversations/recipients.ts";

  let {
    panelProps,
    options,
    selected,
    busy = false,
    onToggle,
    onMentionPerson,
    onAutoMentionChange,
  }: {
    panelProps: AgentProfileEditorContext;
    options: readonly AgentRecipientOption[];
    selected: readonly string[];
    busy?: boolean;
    onToggle(id: string): void;
    onMentionPerson?(
      person: import("../../../lib/ai/conversations/recipients.ts").ComposerPersonOption,
    ): void;
    onAutoMentionChange?(checked: boolean): void;
  } = $props();
  let open = $state(false),
    query = $state(""),
    adding = $state(false);
  let editing = $state<AgentRecipientOption>();
  const current = $derived(options.find((option) => option.id === selected[0]));
  const editable = $derived(
    panelProps.settings?.agentParticipants?.find(
      (option) => option.id === current?.id,
    ),
  );
  const visible = $derived(
    options.filter((option) =>
      `${option.label} ${option.agent} ${option.model ?? ""}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
    ),
  );
  const disabled = $derived(Boolean(panelProps.initializing));
  const people = $derived(
    (panelProps.mentionPeople ?? []).filter((person) =>
      person.label
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
    ),
  );
  const settings = $derived(
    panelProps.app
      ? getWorkspaceHostBinding(panelProps.app.workspace).controller.settings
      : undefined,
  );
  function choose(id: string) {
    open = false;
    onToggle(id);
  }
</script>

<Popover.Root
  {open}
  onOpenChange={(next) => {
    open = next;
    if (next) query = "";
  }}
>
  <Popover.Trigger>
    {#snippet child({ props })}
      <ChatMentionButton
        buttonProps={props}
        {disabled}
        member={current}
        active={panelProps.settings?.automaticallyMentionAgents === true}
        onDismiss={() => onAutoMentionChange?.(false)}
      />
    {/snippet}
  </Popover.Trigger>
  <Popover.Content
    align="end"
    side="top"
    sideOffset={8}
    style="--ui-popover-width: min(24rem, calc(100vw - 2rem)); --ui-popover-padding: 0; --ui-popover-gap: 0;"
  >
    <Popover.Title class="sr-only">Tag people or agents</Popover.Title>
    <CommandView.Root label="Tag people or agents" shouldFilter={false} loop>
      <div class="agent-picker-search">
        <CommandView.Input
          bind:value={query}
          placeholder="Search people or agents"
          aria-label="Search people or agents"
        />
        <Popover.Close
          >{#snippet child({ props })}<Button
              {...props}
              variant="ghost"
              size="icon-sm"
              aria-label="Close agent selector"
              ><XIcon aria-hidden="true" /></Button
            >{/snippet}</Popover.Close
        >
      </div>
      <CommandView.List>
        {#if !visible.length && !people.length}<CommandView.Empty
            >No matching people or agents.</CommandView.Empty
          >{/if}
        <ChatPeopleOptions
          {people}
          disabled={disabled || !onMentionPerson}
          onSelect={(person) => {
            open = false;
            onMentionPerson?.(person);
          }}
        />
        <CommandView.Group heading="Agents">
          {#each visible as option (option.id)}
            <CommandView.Item
              value={option.id}
              keywords={[option.label, option.agent]}
              disabled={disabled ||
                (!selected.includes(option.id) && selected.length >= 4)}
              data-agent-selected={selected.includes(option.id)}
              onSelect={() => choose(option.id)}
            >
              <CommandView.ItemIcon
                ><Avatar
                  src={option.avatar}
                  background={option.avatarBackground}
                  name={option.label}
                  size="xs"
                  shape="rounded"
                  decorative
                /></CommandView.ItemIcon
              >
              <CommandView.ItemLabel>{option.label}</CommandView.ItemLabel>
              <CommandView.ItemDescription
                >{option.agent === "codex"
                  ? "Codex"
                  : option.agent === "opencode"
                    ? "OpenCode"
                    : option.agent === "local"
                      ? "Lapis AI"
                      : "Cursor"} · {option.model ??
                  "Default model"}</CommandView.ItemDescription
              >
              {#if selected.includes(option.id)}<CheckIcon
                  aria-hidden="true"
                />{/if}
            </CommandView.Item>
          {/each}
        </CommandView.Group>
        <CommandView.Group heading="Manage agents">
          {#if settings?.sections.some((section) => section.id === "ai-agents")}
            <CommandView.Item
              value="__manage_agents__"
              onSelect={() => {
                open = false;
                settings?.open({
                  sectionId: "ai-agents",
                  fieldId: "ai.participants",
                });
              }}
            >
              <CommandView.ItemIcon
                ><SettingsIcon aria-hidden="true" /></CommandView.ItemIcon
              >
              <CommandView.ItemLabel>Manage agents…</CommandView.ItemLabel>
              <CommandView.ItemDescription
                >Open agent profiles in Settings</CommandView.ItemDescription
              >
            </CommandView.Item>
          {/if}
          {#if editable}
            <CommandView.Item
              value="__edit_agent__"
              disabled={disabled || busy || !panelProps.onSettingsChange}
              onSelect={() => {
                editing = editable;
                open = false;
                adding = true;
              }}
            >
              <CommandView.ItemIcon
                ><SettingsIcon aria-hidden="true" /></CommandView.ItemIcon
              >
              <CommandView.ItemLabel
                >Edit {editable.label}…</CommandView.ItemLabel
              >
              <CommandView.ItemDescription
                >Name, client and runtime defaults</CommandView.ItemDescription
              >
            </CommandView.Item>
          {/if}
          <CommandView.Item
            value="__add_agent__"
            disabled={disabled ||
              busy ||
              !panelProps.onSettingsChange ||
              options.length >= 16}
            onSelect={() => {
              editing = undefined;
              open = false;
              adding = true;
            }}
          >
            <CommandView.ItemIcon
              ><PlusIcon aria-hidden="true" /></CommandView.ItemIcon
            >
            <CommandView.ItemLabel>Add agent…</CommandView.ItemLabel>
            <CommandView.ItemDescription
              >Create a named agent for your chats</CommandView.ItemDescription
            >
          </CommandView.Item>
        </CommandView.Group>
      </CommandView.List>
    </CommandView.Root>
    <ChatMentionPreference
      checked={panelProps.settings?.automaticallyMentionAgents === true}
      {disabled}
      onChange={onAutoMentionChange}
    />
  </Popover.Content>
</Popover.Root>
<ChatParticipantDialog
  bind:open={adding}
  participant={editing}
  {panelProps}
  {busy}
/>

<style>
  .agent-picker-search {
    --ui-command-view-border-color: transparent;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.25rem;
    padding-inline: 0.5rem;
  }
</style>
