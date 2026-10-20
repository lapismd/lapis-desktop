<!-- SPDX-License-Identifier: Apache-2.0; copied/adapted from JJ Store CommunityComposerMentionButton.svelte. -->
<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Avatar } from "@lapismd/design-core/shadcn/avatar";
  import AtSignIcon from "@lucide/svelte/icons/at-sign";
  import XIcon from "@lucide/svelte/icons/x";
  import type { AgentRecipientOption } from "../../../lib/ai/conversations/recipients.ts";
  let {
    buttonProps,
    active = false,
    member,
    disabled = false,
    onDismiss,
  }: {
    buttonProps: Record<string, unknown>;
    active?: boolean;
    member?: AgentRecipientOption;
    disabled?: boolean;
    onDismiss?(): void;
  } = $props();
</script>

<span class="chat-mention-button" data-addressed={active ? "true" : "false"}>
  <Button
    {...buttonProps}
    variant="ghost"
    size="icon-sm"
    role="combobox"
    aria-label="Tag people or agents"
    title="Tag people or agents"
    {disabled}
    class="chat-mention-button-host"><AtSignIcon aria-hidden="true" /></Button
  >
  {#if active && member}
    <button
      type="button"
      class="mention-lock"
      aria-label="Stop automatically tagging agents"
      {disabled}
      onmousedown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onclick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDismiss?.();
      }}
    >
      <Avatar
        src={member.avatar}
        background={member.avatarBackground}
        name={member.label}
        shape="rounded"
        size="xs"
        decorative
        style="--ui-avatar-size:1.125rem"
      />
      <span class="mention-dismiss" aria-hidden="true"><XIcon /></span>
    </button>
  {/if}
</span>

<style>
  .chat-mention-button {
    display: inline-flex;
    align-items: center;
    gap: 0.12rem;
  }
  .chat-mention-button[data-addressed="true"] {
    height: 1.75rem;
    padding: 0 0.35rem 0 0.55rem;
    gap: 0.3rem;
    border-radius: 0.5rem;
    background: color-mix(in srgb, var(--foreground) 10%, var(--background));
    color: var(--foreground);
  }
  .chat-mention-button[data-addressed="true"]
    :global(.chat-mention-button-host[data-ui-component="button"]) {
    width: auto;
    height: auto;
    min-width: 0;
    padding: 0;
    background: transparent;
    color: inherit;
  }
  .mention-lock {
    position: relative;
    display: grid;
    width: 1.125rem;
    height: 1.125rem;
    flex: none;
    place-items: center;
    overflow: hidden;
    padding: 0;
    border: 0;
    border-radius: 25%;
    background: transparent;
    cursor: pointer;
  }
  .mention-dismiss {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: var(--foreground);
    color: var(--background);
    opacity: 0;
    pointer-events: none;
  }
  .mention-lock:hover .mention-dismiss,
  .mention-lock:focus-visible .mention-dismiss {
    opacity: 1;
  }
  .mention-dismiss > :global(svg) {
    width: 0.7rem;
    height: 0.7rem;
  }
</style>
