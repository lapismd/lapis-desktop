<!-- SPDX-License-Identifier: Apache-2.0; adapted from jj-store ChatToolPanel.svelte. -->
<script lang="ts">
  import { AppShell } from "@lapismd/design-core/shell";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { SegmentedControl } from "@lapismd/design-core/forms";
  import XIcon from "@lucide/svelte/icons/x";
  import WrenchIcon from "@lucide/svelte/icons/wrench";
  import {
    TranscriptContent,
    TranscriptToolContent,
    type TranscriptController,
    type TranscriptTool,
    type TranscriptBlock,
    type TranscriptProps,
  } from "@lapismd/design-core/chat";
  let {
    tool,
    state,
    opener,
    onClose,
    customBlock,
  }: {
    tool: TranscriptTool;
    state: TranscriptController;
    opener: HTMLElement;
    onClose: () => void;
    customBlock: TranscriptProps["customBlock"];
  } = $props();
  const markdown = $derived(
    tool.blocks.some((block) => block.kind === "markdown"),
  );
  const ToolIcon = $derived(tool.icon ?? WrenchIcon);
  const sourceKey = $derived(`tool-source:${tool.id}`);
  const mode = $derived(
    state.rawTools[tool.id]
      ? "capture"
      : markdown && state.disclosures[sourceKey]
        ? "source"
        : "preview",
  );
  const blocks = $derived<readonly TranscriptBlock[]>(
    mode === "capture"
      ? [
          {
            id: `${tool.id}/raw`,
            revision: tool.revision,
            kind: "code",
            label: `Raw captured data for ${tool.title}`,
            path: "tool.json",
            commentable: tool.commentable,
            text: tool.raw,
          },
        ]
      : mode === "source"
        ? tool.blocks.map((block) => ({ ...block, kind: "code" }))
        : tool.blocks,
  );
  function choose(next: string) {
    state.rawTools[tool.id] = next === "capture";
    state.disclosures[sourceKey] = next === "source";
  }
</script>

<AppShell.SurfaceLayer
  open
  label="Tool details"
  returnFocus={opener}
  onDismiss={onClose}
  style="--ui-shell-surface-layer-inline-end-inset: 0px"
>
  <AppShell.SurfaceLayer.Header class="ai-tool-inspector-header">
    <div class="ai-tool-inspector-title">
      <ToolIcon aria-hidden="true" /><strong title={tool.title}
        >{tool.title}</strong
      >
    </div>
    <div class="ai-tool-inspector-actions">
      <SegmentedControl
        value={mode}
        options={markdown
          ? ["preview", "source", "capture"]
          : ["preview", "capture"]}
        labels={markdown
          ? { preview: "Preview", source: "Source", capture: "Capture" }
          : { preview: "Formatted", capture: "Source" }}
        ariaLabel="Tool output view"
        onChange={choose}
      />
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Close tool details"
        onclick={onClose}><XIcon aria-hidden="true" /></Button
      >
    </div>
  </AppShell.SurfaceLayer.Header>
  <AppShell.SurfaceLayer.Body>
    <div class="ai-tool-inspector-content">
      {#if blocks.length === 1}
        <TranscriptContent {blocks} {state} {customBlock} showHeaders={false} />
      {:else}<TranscriptToolContent {blocks} {state} {customBlock} />{/if}
    </div>
  </AppShell.SurfaceLayer.Body>
</AppShell.SurfaceLayer>

<style>
  :global(.ai-tool-inspector-header) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding-inline: 0.75rem;
    background: var(--background);
  }
  strong {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.8125rem;
  }
  .ai-tool-inspector-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }
  .ai-tool-inspector-title :global(svg) {
    width: 0.875rem;
    height: 0.875rem;
    flex: none;
    color: var(--muted-foreground);
  }
  .ai-tool-inspector-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: none;
  }
  .ai-tool-inspector-content {
    min-width: 0;
    padding: 1rem 2rem;
  }
</style>
