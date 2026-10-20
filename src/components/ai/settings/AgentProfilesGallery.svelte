<!-- SPDX-License-Identifier: Apache-2.0; copied/adapted from jj-store CommunityAgents. -->
<script lang="ts">
  import { Avatar } from "@lapismd/design-core/shadcn/avatar";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import MoreIcon from "@lucide/svelte/icons/ellipsis-vertical";
  import type { AgentRecipientOption } from "../../../lib/ai/conversations/recipients.ts";
  import "./agent-profiles.css";
  let {
    profiles,
    pending = false,
    onAdd,
    onEdit,
    onRemove,
  }: {
    profiles: readonly AgentRecipientOption[];
    pending?: boolean;
    onAdd: () => void;
    onEdit: (profile: AgentRecipientOption) => void;
    onRemove: (profile: AgentRecipientOption) => void;
  } = $props();
  const labels = { codex: "Codex", cursor: "Cursor", opencode: "OpenCode" };
</script>

<section class="agent-profiles" aria-label="Your agents">
  <header>
    <p>
      Named agents available to chats in this vault. Choose them with @ or the
      Agents picker.
    </p>
  </header>
  <div class="agent-profiles__grid">
    <button
      class="agent-profiles__add"
      type="button"
      aria-label="Add agent"
      disabled={pending || profiles.length >= 16}
      onclick={onAdd}
    >
      <span class="agent-profiles__add-image"
        ><PlusIcon aria-hidden="true" /></span
      ><span>Add agent</span>
    </button>
    {#each profiles as profile (profile.id)}
      <div class="agent-profiles__card" data-agent-id={profile.id}>
        <button
          class="agent-profiles__open"
          type="button"
          disabled={pending}
          aria-label={`Edit ${profile.label}`}
          onclick={() => onEdit(profile)}
        ></button>
        <div class="agent-profiles__avatar">
          <Avatar
            src={profile.avatar}
            background={profile.avatarBackground}
            name={profile.label}
            size="2xl"
            shape="rounded"
            decorative
          />
        </div>
        <div class="agent-profiles__details">
          <strong>{profile.label}</strong>
          {#if profile.description}<span title={profile.description}
              >{profile.description}</span
            >{/if}
          <span>{labels[profile.agent]}</span><span
            >{profile.model || "Chat default model"}{profile.thinking
              ? ` · ${profile.thinking}`
              : ""}</span
          >
        </div>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            >{#snippet child({ props })}<Button
                {...props}
                class="agent-profiles__menu"
                variant="ghost"
                size="icon-sm"
                disabled={pending}
                aria-label={`Actions for ${profile.label}`}
                ><MoreIcon aria-hidden="true" /></Button
              >{/snippet}</DropdownMenu.Trigger
          >
          <DropdownMenu.Content align="end"
            ><DropdownMenu.Group>
              <DropdownMenu.Item onSelect={() => onEdit(profile)}
                >Edit agent</DropdownMenu.Item
              >
              <DropdownMenu.Item
                variant="destructive"
                onSelect={() => onRemove(profile)}
                >Remove agent</DropdownMenu.Item
              >
            </DropdownMenu.Group></DropdownMenu.Content
          >
        </DropdownMenu.Root>
      </div>
    {/each}
  </div>
  {#if !profiles.length}<p>
      Add an agent to save its name, avatar and runtime defaults.
    </p>{/if}
</section>
