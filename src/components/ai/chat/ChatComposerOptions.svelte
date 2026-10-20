<script lang="ts">
  import type { ChatPanelActions } from "../../../lib/ai/chat/panel/actions.ts";
  // SPDX-License-Identifier: Apache-2.0
  // Retained Lapis chat presentation; see src/lib/ai/NOTICE.md.
  import { Button } from "@lapismd/design-core/shadcn/button";
  import ChatPermissions from "./ChatPermissions.svelte";
  import ChatAgentOptions from "./ChatAgentOptions.svelte";
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
<ChatPermissions {panelProps} {controller} {composerState} />
<ChatAgentOptions
  {composerState}
  {initializing}
  selectRuntime={!!selectRuntime}
/>
