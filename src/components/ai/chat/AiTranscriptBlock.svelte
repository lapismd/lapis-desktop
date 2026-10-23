<script lang="ts">
  import * as Chat from "@lapismd/design-core/ai/chat";
  import {
    resolveToolResultView,
    parseToolResultPayload,
  } from "../../../lib/ai/chat/chat-result-views.ts";
  import type { AiChatItem } from "../../../lib/ai/chat/chat-items.ts";
  import type { TranscriptPanelProps } from "../../../lib/ai/chat/panel/transcript.ts";
  import AiInventoryResult from "./AiInventoryResult.svelte";
  import {
    AgentCommandReport as AiCommandReport,
    AgentToolResult,
  } from "@lapismd/agent-ui/chat";
  import { isSlashCommandNotice } from "../../../lib/ai/chat/chat-items.ts";

  let { item, panel }: { item: AiChatItem; panel: TranscriptPanelProps } =
    $props();
  const app = $derived(panel.panelProps.app);
  const conversation = $derived({
    conversationId: panel.controller.location?.conversationId,
    scopeDirectory: panel.controller.location?.scopeDir,
  });
  const ResultView = $derived(
    item.type === "tool" ? resolveToolResultView(app, item.name) : undefined,
  );
  const output = $derived(
    item.type === "tool" ? parseToolResultPayload(item.output) : undefined,
  );
</script>

{#if item.type === "tool"}
  {#if ResultView && app && output != null && item.state === "completed"}
    <ResultView
      {app}
      {conversation}
      name={item.name}
      input={parseToolResultPayload(item.input)}
      {output}
      state="completed"
    />
  {:else}
    <AgentToolResult
      result={{
        name: item.name,
        input: item.input,
        output: item.state === "error" ? undefined : item.output,
        error: item.state === "error" ? item.output : undefined,
      }}
    />
  {/if}
{:else if item.type === "status" && item.layout === "inventory"}
  <AiInventoryResult
    {app}
    {conversation}
    name={item.inventory?.kind ?? "skills"}
    output={item.inventory}
  />
{:else if isSlashCommandNotice(item)}
  <AiCommandReport text={item.text} />
{:else if "text" in item}
  <Chat.SystemMessage>{item.text}</Chat.SystemMessage>
{/if}
