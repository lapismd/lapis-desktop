<script lang="ts">
  import {
    TranscriptToolContent,
    type TranscriptController,
    type TranscriptTool,
  } from "@lapismd/design-core/chat";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  let {
    tool,
    state,
    onClose,
  }: {
    tool: TranscriptTool;
    state: TranscriptController;
    onClose: () => void;
  } = $props();
</script>

<aside aria-label="Source inspector">
  <Button onclick={onClose}>Close source inspector</Button><ScrollArea
    ><TranscriptToolContent blocks={tool.blocks} {state} /></ScrollArea
  >
</aside>
