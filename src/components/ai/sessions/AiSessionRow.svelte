<!-- SPDX-License-Identifier: Apache-2.0; CommunityInboxItem port, jj-store 08b58c7e. -->
<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { agentAvatar } from "../../../lib/ai/presentation/agent-avatar.ts";
  import { Avatar } from "@lapismd/design-core/shadcn/avatar";
  import { formatRelativeTime } from "@lapismd/design-core/shadcn/relative-time";
  import type { SessionItem } from "../../../lib/ai/session-browser/model.ts";
  let {
    item,
    active,
    disabled,
    action,
    onSelect,
  }: {
    item: SessionItem;
    active: boolean;
    disabled: boolean;
    action: string;
    onSelect: () => void;
  } = $props();
</script>

<div class="session-item-row">
  <Button
    variant="ghost"
    class="session-item"
    data-active={active || undefined}
    aria-pressed={active}
    {disabled}
    onclick={onSelect}
  >
    <Avatar
      src={agentAvatar(item.harness)}
      name={item.harness ?? "AI"}
      size="xs"
      shape="rounded"
      decorative
    />
    <span class="session-item__body">
      <span class="session-item__verb">{action} </span>
      <span class="session-item__heading"
        ><strong title={item.title}>{item.title}</strong></span
      >
      <span class="session-item__detail">
        <span class="session-item__context" title={item.path}
          >{item.path ?? item.profile}{item.status
            ? ` · ${item.status}`
            : ""}</span
        >
        {#if Number.isFinite(Date.parse(item.updatedAt))}<time
            class="session-item__time"
            datetime={item.updatedAt}
            title={new Date(item.updatedAt).toLocaleString()}
            >{formatRelativeTime(Date.parse(item.updatedAt)).text}</time
          >{/if}
      </span>
    </span>
  </Button>
</div>

<style>
  .session-item__verb {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .session-item-row {
    position: relative;
    min-width: 0;
  }
  .session-item-row :global(.session-item) {
    display: grid;
    width: 100%;
    height: auto;
    min-height: 3.25rem;
    grid-template-columns: 1.5rem minmax(0, 1fr);
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.625rem;
    text-align: start;
    white-space: normal;
  }
  .session-item-row :global(.session-item[data-active]) {
    background: color-mix(in srgb, var(--accent) 72%, transparent);
  }
  .session-item__body {
    display: grid;
    min-width: 0;
    grid-template-columns: minmax(0, 1fr);
    gap: 0.125rem;
  }
  .session-item__heading {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 0.5rem;
  }
  strong {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .session-item__detail {
    display: flex;
    min-width: 0;
    align-items: baseline;
    gap: 0.5rem;
  }
  .session-item__context {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--muted-foreground);
    font-size: 0.8125rem;
  }
  .session-item__time {
    flex: none;
    color: var(--muted-foreground);
    font-size: 0.8125rem;
  }
</style>
