<!-- SPDX-License-Identifier: Apache-2.0; shared Notes session/file-preview body. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import AiSessionHeader from "./AiSessionHeader.svelte";
  let {
    title,
    status,
    harness,
    selected = false,
    listLabel = "Sessions",
    expanded = false,
    onToggle,
    identity,
    actions,
    footer,
    children,
    height,
  }: {
    title: string;
    status?: string;
    harness?: string;
    selected?: boolean;
    listLabel?: string;
    expanded?: boolean;
    onToggle?: () => void;
    identity?: Snippet;
    actions?: Snippet;
    footer?: Snippet;
    children: Snippet;
    height: number;
  } = $props();
</script>

<section class="ai-session-thread" style={`height:${height}px`}>
  <AiSessionHeader
    {title}
    {status}
    {harness}
    {selected}
    {listLabel}
    {expanded}
    {onToggle}
    {identity}
    {actions}
  />
  <div class="ai-session-thread-body">{@render children()}</div>
  {@render footer?.()}
</section>
