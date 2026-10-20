<!-- SPDX-License-Identifier: Apache-2.0; copied/adapted from jj-store CommunityAgentEditorHarnessIcon. -->
<script lang="ts">
  import BotIcon from "@lucide/svelte/icons/bot";
  import MousePointer2Icon from "@lucide/svelte/icons/mouse-pointer-2";
  import SparklesIcon from "@lucide/svelte/icons/sparkles";
  import TerminalIcon from "@lucide/svelte/icons/terminal";

  let {
    runtimeAgent,
    class: className = "",
  }: { runtimeAgent: string; class?: string } = $props();

  const Icon = $derived(
    runtimeAgent === "codex"
      ? SparklesIcon
      : runtimeAgent === "cursor"
        ? MousePointer2Icon
        : runtimeAgent === "opencode"
          ? TerminalIcon
          : BotIcon,
  );
</script>

<Icon class={className} aria-hidden="true" />
