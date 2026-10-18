<script lang="ts">
  import { onDestroy } from "svelte";
  import CheckIcon from "@lucide/svelte/icons/check";
  import CopyIcon from "@lucide/svelte/icons/copy";
  import TriangleAlertIcon from "@lucide/svelte/icons/triangle-alert";
  import { operationMessageParts } from "../../lib/repository/operation-message.ts";
  let {
    message,
    onSelect,
    copyText,
    onCopyError,
    textHover = true,
  }: {
    message: string;
    onSelect?(): void;
    copyText(value: string): Promise<void>;
    onCopyError?(error: unknown): void;
    textHover?: boolean;
  } = $props();
  const parts = $derived(operationMessageParts(message));
  let feedback = $state<{ id: string; failed: boolean }>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let sequence = 0,
    destroyed = false;
  function reset() {
    clearTimeout(timer);
    sequence++;
    feedback = undefined;
  }
  $effect(() => {
    message;
    reset();
  });
  onDestroy(() => {
    destroyed = true;
    reset();
  });
  async function copy(value: string) {
    const request = ++sequence;
    clearTimeout(timer);
    feedback = undefined;
    let failed = false,
      failure: unknown;
    try {
      await copyText(value);
    } catch (error) {
      failed = true;
      failure = error;
    }
    if (destroyed || sequence !== request) return;
    feedback = { id: value, failed };
    if (failed) onCopyError?.(failure);
    timer = setTimeout(() => (feedback = undefined), 1500);
  }
</script>

<span class="repository-review-operation-message">
  {#each parts as part, index (index)}
    {#if part.type === "text"}
      {#if onSelect}<button
          class="message-text"
          data-quiet={!textHover || undefined}
          type="button"
          onclick={onSelect}>{part.value}</button
        >
      {:else}<span class="message-text">{part.value}</span>{/if}
    {:else}
      {@const label = part.type === "change" ? "change ID" : "commit ID"}
      {@const status = feedback?.id === part.value ? feedback : undefined}
      <button
        type="button"
        class="message-id"
        data-change={part.type === "change" || undefined}
        aria-label={`Copy full ${label}: ${part.value}; ${part.value.slice(0, 8)}…${part.value.slice(-4)}`}
        title={`Copy full ${label}`}
        onclick={(event) => {
          event.stopPropagation();
          void copy(part.value);
        }}
        onpointerdown={(event) => event.stopPropagation()}
        onkeydown={(event) => {
          if (event.key === "Enter" || event.key === " ")
            event.stopPropagation();
        }}
      >
        <code>{part.value.slice(0, 8)}…{part.value.slice(-4)}</code>
        {#if status?.failed}<TriangleAlertIcon aria-hidden="true" />
        {:else if status}<CheckIcon aria-hidden="true" />{:else}<CopyIcon
            aria-hidden="true"
          />{/if}
      </button>
    {/if}
  {/each}
  <span class="copy-status" role="status" aria-live="polite"
    >{feedback && !feedback.failed ? "Copied full ID." : ""}</span
  >
</span>

<style>
  .repository-review-operation-message {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    min-width: 0;
    max-width: 100%;
    flex: 1 1 auto;
    overflow: hidden;
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.25rem;
    white-space: nowrap;
  }
  .message-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  button.message-text {
    border: 0;
    padding: 0;
    color: inherit;
    background: transparent;
    font: inherit;
    text-align: start;
    cursor: pointer;
  }
  .message-id {
    display: inline-flex;
    flex: none;
    height: 1.35rem;
    align-items: center;
    gap: 0.25rem;
    padding: 0 0.3rem;
    border: 1px solid transparent;
    border-radius: 0.35rem;
    color: inherit;
    background: color-mix(in srgb, currentcolor 7%, transparent);
    cursor: pointer;
  }
  .message-id[data-change] {
    color: var(--primary);
  }
  .message-id code {
    font-family: var(--font-mono, monospace);
    font-size: 0.75rem;
    font-weight: 500;
  }
  .message-id :global(svg) {
    width: 0.7rem;
    height: 0.7rem;
    flex: none;
  }
  .message-id:hover,
  button.message-text:not([data-quiet]):hover {
    background: color-mix(in srgb, var(--foreground) 12%, var(--background));
  }
  button:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
  .copy-status {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
</style>
