<!-- SPDX-License-Identifier: Apache-2.0; CommunityInboxThreadHeader port, jj-store 08b58c7e. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { agentAvatar } from "../../../lib/ai/presentation/agent-avatar.ts";
  import { Avatar } from "@lapismd/design-core/shadcn/avatar";
  import AiSessionToggleIcon from "./AiSessionToggleIcon.svelte";
  let {
    title,
    status,
    selected,
    listLabel,
    expanded,
    onToggle,
    actions,
    harness,
    identity,
  }: {
    title: string;
    status?: string;
    selected: boolean;
    listLabel: string;
    expanded: boolean;
    onToggle?: () => void;
    identity?: Snippet;
    actions?: Snippet;
    harness?: string;
  } = $props();
</script>

<header class="session-header">
  <div class="session-header__identity">
    {#if onToggle}<Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Toggle ${listLabel.toLowerCase()}`}
        title={`Toggle ${listLabel.toLowerCase()}`}
        aria-pressed={expanded}
        onclick={onToggle}
      >
        <AiSessionToggleIcon side="left" {expanded} />
      </Button>{/if}
    {#if identity}{@render identity()}{:else if selected}<Avatar
        src={agentAvatar(harness)}
        name={harness ?? "AI session"}
        size="sm"
        shape="rounded"
        decorative
      />{/if}
    <div class="session-header__text">
      <h1 {title}>{title}</h1>
      {#if status}<p role="status">{status}</p>{/if}
    </div>
  </div>
  <div class="session-header__actions">{@render actions?.()}</div>
</header>

<style>
  .session-header {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    min-height: 3.25rem;
    padding: 0.55rem 1rem 0.55rem 0.5rem;
    flex: none;
    justify-content: space-between;
    gap: 1rem;
    background: var(--background);
  }
  .session-header__identity {
    display: flex;
    flex: 1;
    align-items: center;
    min-width: 0;
    gap: 0.75rem;
  }
  .session-header__text {
    flex: 1;
    min-width: 0;
  }
  h1 {
    overflow: hidden;
    margin: 0;
    font-size: 0.875rem;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  p {
    margin: 0;
    color: var(--muted-foreground);
    font-size: 0.8125rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .session-header__actions {
    display: flex;
    align-items: center;
    flex: none;
    gap: 0.25rem;
  }
</style>
