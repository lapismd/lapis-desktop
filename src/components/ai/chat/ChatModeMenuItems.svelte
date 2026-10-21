<script lang="ts">
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import CheckIcon from "@lucide/svelte/icons/check";
  import BotIcon from "@lucide/svelte/icons/bot";
  import ListTodoIcon from "@lucide/svelte/icons/list-todo";
  import MessageCircleIcon from "@lucide/svelte/icons/message-circle";
  import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
  import ShieldIcon from "@lucide/svelte/icons/shield";
  import type { AgentRecipientOption } from "../../../lib/ai/conversations/recipients.ts";
  import type { ComposerPermissions } from "../../../lib/ai/chat/panel/permissions.svelte.ts";
  import type { ExecutionMode } from "../../../lib/ai/core/agent-profile.ts";
  let {
    targets,
    permissions,
    modes,
    loading,
    choose,
  }: {
    targets: readonly Pick<
      AgentRecipientOption,
      "id" | "agent" | "label" | "executionMode"
    >[];
    permissions: ComposerPermissions;
    modes: Record<string, ExecutionMode[]>;
    loading: boolean;
    choose: (id: string, mode?: string) => void;
  } = $props();
  function iconForMode(id: string) {
    switch (id) {
      case "agent":
      case "build":
        return BotIcon;
      case "plan":
        return ListTodoIcon;
      case "ask":
        return MessageCircleIcon;
      case "default":
        return RotateCcwIcon;
      default:
        return ShieldIcon;
    }
  }
</script>

{#each targets as target (target.id)}
  <DropdownMenu.Group>
    {#if targets.length > 1}<DropdownMenu.GroupHeading
        >{target.label}</DropdownMenu.GroupHeading
      >{/if}
    <DropdownMenu.Item onclick={() => choose(target.id)}>
      <RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
      Use agent default
      {#if !Object.hasOwn(permissions.overrides, target.id)}<CheckIcon
          aria-hidden="true"
        />{/if}
    </DropdownMenu.Item>
    <DropdownMenu.RadioGroup value={permissions.effective(target)}>
      {#each modes[target.agent] ?? [] as mode (mode.id)}
        {@const ModeIcon = iconForMode(mode.id)}
        <DropdownMenu.RadioItem
          value={mode.id}
          disabled={loading}
          onclick={() => choose(target.id, mode.id)}
        >
          <ModeIcon data-icon="inline-start" aria-hidden="true" />
          {mode.name}
        </DropdownMenu.RadioItem>
      {/each}
    </DropdownMenu.RadioGroup>
    {#if loading}
      <DropdownMenu.Item disabled>Loading modes…</DropdownMenu.Item>
    {:else if !modes[target.agent]?.length}
      <DropdownMenu.Item disabled
        >No selectable modes advertised</DropdownMenu.Item
      >
    {:else if !(modes[target.agent] ?? []).some((mode) => mode.id === permissions.effective(target))}
      <DropdownMenu.Item disabled
        >Saved mode: {permissions.effective(target)}</DropdownMenu.Item
      >
    {/if}
  </DropdownMenu.Group>
{/each}
