<!-- SPDX-License-Identifier: Apache-2.0; adapted from JJ Store CommunityComposerRemovableChip/ChipDismiss. -->
<script lang="ts">
  import { AuthorCard } from "@lapismd/design-core/shadcn/author-card";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import LinkIcon from "@lucide/svelte/icons/link";
  import XIcon from "@lucide/svelte/icons/x";
  let {
    label,
    title,
    kind,
    image,
    background,
    identityId,
    description,
    onRemove,
  }: {
    label: string;
    title: string;
    kind: "agent" | "person" | "file" | "link";
    image?: string;
    background?: string;
    identityId?: string;
    description?: string;
    onRemove?: () => void;
  } = $props();
</script>

<span
  class="chat-inline-reference"
  data-member={kind === "agent" || kind === "person" || undefined}
  data-agent-reference={kind === "agent" ? identityId : undefined}
  title={kind === "agent" || kind === "person" ? undefined : title}
  contenteditable="false"
>
  {#if kind === "agent" || kind === "person"}
    <AuthorCard
      author={{
        id: identityId ?? title,
        name: label,
        src: image,
        background,
        shape: kind === "agent" ? "rounded" : "circle",
      }}
      trigger="mention"
      interaction="hover"
      size="md"
      role={kind === "agent" ? "Agent" : "Person"}
      {description}
      label={`About ${label}`}
      class="chat-inline-author"
    />
  {:else}<span class="reference-label">
      {#if kind === "file"}<FileTextIcon aria-hidden="true" />
      {:else}<LinkIcon aria-hidden="true" />{/if}
      <span>{label}</span>
    </span>{/if}
  {#if onRemove}<button
      type="button"
      aria-label={`Remove ${kind === "agent" || kind === "person" ? "@" : ""}${label}`}
      onmousedown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onclick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onRemove();
      }}
    >
      <XIcon aria-hidden="true" />
    </button>{/if}
</span>

<style>
  .chat-inline-reference {
    display: inline-flex;
    overflow: hidden;
    align-items: stretch;
    max-width: min(18rem, 100%);
    height: 1lh;
    vertical-align: baseline;
    border-radius: calc(var(--radius) - 0.2rem);
    background: var(--secondary);
    color: var(--secondary-foreground);
    font: inherit;
    font-size: 0.875em;
  }
  .reference-label {
    display: inline-flex;
    align-items: center;
    gap: 0.25em;
    min-width: 0;
    padding-inline: 0.3em;
  }
  .chat-inline-reference[data-member] {
    height: 1.5rem;
    font-size: 1em;
    vertical-align: middle;
    --ui-author-card-avatar-size: 1.125rem;
  }
  .chat-inline-reference :global(.chat-inline-author[data-trigger="mention"]) {
    min-width: 0;
    height: 100%;
    padding: 0 0.375rem;
    border-radius: 0;
    background: transparent;
    font-size: inherit;
  }
  .chat-inline-reference :global(.chat-inline-author > span) {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .reference-label > span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .reference-label > :global(svg) {
    width: 0.9em;
    height: 0.9em;
    flex: none;
  }
  button {
    display: inline-grid;
    place-items: center;
    width: 1.2em;
    min-height: 100%;
    flex: none;
    padding: 0 0.12em 0 0.16em;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    box-shadow: inset 1px 0 0 color-mix(in srgb, currentcolor 16%, transparent);
  }
  button:hover,
  button:focus-visible {
    background: color-mix(in srgb, var(--foreground) 16%, transparent);
  }
  button > :global(svg) {
    width: 0.72em;
    height: 0.72em;
  }
</style>
