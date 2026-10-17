<script lang="ts">
  import type { ChatPanelActions } from "../../../lib/ai/chat/panel/actions.ts";
  // SPDX-License-Identifier: Apache-2.0
  // Retained Lapis chat presentation; see src/lib/ai/NOTICE.md.
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import BrainIcon from "@lucide/svelte/icons/brain";
  import PinIcon from "@lucide/svelte/icons/pin";
  import PinOffIcon from "@lucide/svelte/icons/pin-off";
  import type { ComposerState } from "../../../lib/ai/chat/panel/composer.svelte.ts";
  import type { AiChatController } from "../../../lib/ai/chat/chat-controller.svelte.ts";
  import type { AiChatPanelProps } from "../../../lib/ai/chat/panel/props.ts";

  let {
    panelProps,
    controller,
    actions,
    composerState,
  }: {
    panelProps: AiChatPanelProps;
    controller: AiChatController;
    actions: ChatPanelActions;
    composerState: ComposerState;
  } = $props();
  const initializing = $derived(panelProps.initializing ?? false);
  const selectRuntime = $derived(panelProps.selectRuntime);
</script>

<Button
  size="icon-sm"
  variant="ghost"
  aria-label={controller.conversationPinned
    ? "Unpin conversation"
    : "Pin conversation"}
  aria-pressed={controller.conversationPinned}
  data-testid="ai-chat-pin"
  disabled={initializing || !controller.location}
  onclick={() =>
    void actions.perform(() =>
      controller.setPinned(!controller.conversationPinned),
    )}
>
  {#if controller.conversationPinned}
    <PinOffIcon aria-hidden="true" />
  {:else}
    <PinIcon aria-hidden="true" />
  {/if}
</Button>
<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props }: { props: Record<string, unknown> })}
      <Button
        {...props}
        size="icon-sm"
        variant="ghost"
        aria-label="Effort and model"
        data-testid="ai-chat-effort"
        disabled={initializing}
      >
        <BrainIcon aria-hidden="true" />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content data-ui-part="effort-popover" align="start">
    {#if selectRuntime}
      <DropdownMenu.Sub>
        <DropdownMenu.SubTrigger data-testid="ai-chat-agent">
          Agent
        </DropdownMenu.SubTrigger>
        <DropdownMenu.SubContent>
          <DropdownMenu.RadioGroup
            value={`${composerState.selectedRuntime}:${composerState.selectedAgent}`}
          >
            <DropdownMenu.RadioItem
              value="acp:codex"
              onclick={() => composerState.changeAgent("codex", "acp")}
              >Codex ACP</DropdownMenu.RadioItem
            >
            <DropdownMenu.RadioItem
              value="acp:cursor"
              onclick={() => composerState.changeAgent("cursor", "acp")}
              >Cursor ACP</DropdownMenu.RadioItem
            >
            <DropdownMenu.RadioItem
              value="acp:opencode"
              onclick={() => composerState.changeAgent("opencode", "acp")}
              >OpenCode ACP</DropdownMenu.RadioItem
            >
          </DropdownMenu.RadioGroup>
        </DropdownMenu.SubContent>
      </DropdownMenu.Sub>
    {/if}
    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger data-testid="ai-chat-model">
        Model
      </DropdownMenu.SubTrigger>
      <DropdownMenu.SubContent>
        {#if composerState.catalogState?.loading}
          <DropdownMenu.Group
            ><DropdownMenu.Item disabled>Loading models…</DropdownMenu.Item
            ></DropdownMenu.Group
          >
        {:else if composerState.modelOptions.length > 0}
          <DropdownMenu.RadioGroup value={composerState.selectedModel}>
            {#each composerState.modelOptions as option (option.model)}
              <DropdownMenu.RadioItem
                value={option.model}
                onclick={() => composerState.changeModel(option.model)}
              >
                {option.displayName ?? option.model}
                {#if option.badges?.length}
                  <span data-ai-part="model-badge">
                    {option.badges.join(" ")}
                  </span>
                {/if}
              </DropdownMenu.RadioItem>
            {/each}
          </DropdownMenu.RadioGroup>
        {:else}
          <DropdownMenu.Item disabled>No models available</DropdownMenu.Item>
        {/if}
      </DropdownMenu.SubContent>
    </DropdownMenu.Sub>
    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger data-testid="ai-chat-thinking">
        Thinking
      </DropdownMenu.SubTrigger>
      <DropdownMenu.SubContent>
        <DropdownMenu.RadioGroup value={composerState.selectedThinking}>
          <DropdownMenu.RadioItem
            value="off"
            onclick={() => composerState.changeThinking("off")}
            >Off</DropdownMenu.RadioItem
          >
          <DropdownMenu.RadioItem
            value="low"
            onclick={() => composerState.changeThinking("low")}
            >Low</DropdownMenu.RadioItem
          >
          <DropdownMenu.RadioItem
            value="medium"
            onclick={() => composerState.changeThinking("medium")}
            >Medium</DropdownMenu.RadioItem
          >
          <DropdownMenu.RadioItem
            value="high"
            onclick={() => composerState.changeThinking("high")}
            >High</DropdownMenu.RadioItem
          >
        </DropdownMenu.RadioGroup>
      </DropdownMenu.SubContent>
    </DropdownMenu.Sub>
  </DropdownMenu.Content>
</DropdownMenu.Root>
