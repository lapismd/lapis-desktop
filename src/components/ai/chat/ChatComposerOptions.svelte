<script lang="ts">
  // SPDX-License-Identifier: Apache-2.0
  // Retained Lapis chat presentation; see src/lib/ai/NOTICE.md.
  import ChatAgentOptions from "./ChatAgentOptions.svelte";
  import type { ComposerState } from "../../../lib/ai/chat/panel/composer.svelte.ts";
  import type { AiChatPanelProps } from "../../../lib/ai/chat/panel/props.ts";

  let {
    panelProps,
    composerState,
  }: {
    panelProps: AiChatPanelProps;
    composerState: ComposerState;
  } = $props();
  const initializing = $derived(panelProps.initializing ?? false);
  const selectRuntime = $derived(panelProps.selectRuntime);
</script>

<ChatAgentOptions
  {composerState}
  {initializing}
  selectRuntime={!!selectRuntime}
/>
