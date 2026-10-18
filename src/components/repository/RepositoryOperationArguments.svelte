<script lang="ts">
  import TerminalIcon from "@lucide/svelte/icons/terminal";
  import { operationCommandLabel } from "../../lib/repository/operation-command.ts";
  let { attributes }: { attributes: Readonly<Record<string, string>> } =
    $props();
  const command = $derived(
    attributes.args ? operationCommandLabel(attributes.args) : undefined,
  );
</script>

{#if command?.trim()}
  <section
    class="repository-review-operation-command"
    aria-label="Recorded operation command"
  >
    <div class="repository-review-command-label">
      <TerminalIcon aria-hidden="true" />Command
    </div>
    <pre><code>{command}</code></pre>
  </section>
{/if}

<style>
  .repository-review-operation-command {
    min-width: 0;
    padding: 0.75rem 1rem;
    font-size: 0.75rem;
  }
  .repository-review-command-label {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    color: var(--muted-foreground);
  }
  .repository-review-command-label :global(svg) {
    width: 0.875rem;
    height: 0.875rem;
  }
  pre {
    margin: 0.375rem 0 0;
    padding: 0.5rem 0.625rem;
    border-radius: calc(var(--radius) * 0.8);
    background: color-mix(in srgb, var(--foreground) 5%, var(--background));
    color: var(--foreground);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  code {
    font-family: var(--font-mono, monospace);
    font-size: inherit;
  }
</style>
