<script lang="ts">
  import { MarkdownContent } from "@lapismd/design-core/chat";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  let { description }: { description: string } = $props();
  const id = $props.id();
  let expanded = $state(false),
    overflowing = $state(false);
  // The graph row owns the subject; its expanded area retains the full body.
  const body = $derived(description.split("\n").slice(1).join("\n").trim());
  $effect(() => {
    void description;
    expanded = false;
  });
  function measure(node: HTMLDivElement) {
    const update = () => {
      const rem = parseFloat(
        getComputedStyle(node.ownerDocument.documentElement).fontSize,
      );
      overflowing = node.getBoundingClientRect().height > 9 * rem + 1;
    };
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return { destroy: () => observer.disconnect() };
  }
</script>

{#if body}
  <section
    class="repository-review-commit-message"
    aria-label="Commit message body"
  >
    <div
      {id}
      class="repository-review-message-viewport"
      data-clamped={(overflowing && !expanded) || undefined}
      onfocusin={() => {
        // Keyboard focus on Markdown links must reveal their full context.
        if (overflowing) expanded = true;
      }}
    >
      <div use:measure>
        <MarkdownContent content={body} compact fullWidth />
      </div>
    </div>
    {#if overflowing}
      <div class="repository-review-message-action">
        <Button
          variant="ghost"
          size="xs"
          aria-controls={id}
          aria-expanded={expanded}
          aria-label={expanded
            ? "View less of commit message"
            : "View more of commit message"}
          onclick={() => (expanded = !expanded)}
        >
          {expanded ? "View less" : "View more"}
          <ChevronDownIcon
            data-icon="inline-end"
            data-expanded={expanded}
            aria-hidden="true"
          />
        </Button>
      </div>
    {/if}
  </section>
{/if}

<style>
  .repository-review-commit-message {
    min-width: 0;
    margin: 0.25rem 0.75rem 0.75rem;
    padding: 0.75rem;
    border-radius: calc(var(--radius) * 0.8);
    background: color-mix(in srgb, var(--foreground) 5%, var(--background));
    --ui-chat-markdown-padding: 0;
    --ui-chat-markdown-font-size: 0.8125rem;
    --ui-chat-markdown-line-height: 1.5;
  }
  .repository-review-message-viewport[data-clamped] {
    max-height: 9rem;
    overflow: hidden;
    mask-image: linear-gradient(to bottom, #000 calc(100% - 3rem), transparent);
  }
  .repository-review-message-action {
    display: flex;
    margin-block-start: 0.375rem;
  }
  .repository-review-message-action :global([data-expanded="true"]) {
    transform: rotate(180deg);
  }
</style>
