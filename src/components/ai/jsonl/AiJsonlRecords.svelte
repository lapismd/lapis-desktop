<!-- SPDX-License-Identifier: Apache-2.0; read-only validated agent/generic records. -->
<script lang="ts">
  import * as Collapsible from "@lapismd/design-core/shadcn/collapsible";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import { CodeBlock } from "@lapismd/design-core/shadcn/code-block";
  import { MarkdownContent } from "@lapismd/design-core/chat";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import { formatChatTimestamp } from "../../../lib/ai/chat/chat-time.ts";
  import type { AgentBindingRecord } from "../../../lib/ai/conversations/types.ts";
  import type { AiJsonlPreview } from "../../../lib/ai/jsonl/preview.ts";
  let {
    preview,
  }: { preview: Extract<AiJsonlPreview, { kind: "agents" | "records" }> } =
    $props();
  function title(record: AgentBindingRecord): string {
    switch (record.type) {
      case "binding.created":
        return `Agent binding created · ${record.agent ?? record.runtime}`;
      case "usage.updated":
        return `Context usage updated · ${record.usage.used.toLocaleString()} of ${record.usage.limit.toLocaleString()}`;
      case "binding.context.updated":
        return `Context checkpoint updated · ${record.cause}`;
      case "binding.config.updated":
        return "Agent configuration updated";
      case "handoff.summary.created":
        return "Handoff summary created";
    }
  }
</script>

<ScrollArea class="jsonl-records" aria-label="JSONL records">
  <div class="jsonl-records__content">
    {#if preview.kind === "agents"}
      {#each preview.records as record (record.id)}
        <section
          class="jsonl-record"
          data-record-type={record.type}
          aria-label={title(record)}
        >
          <header>
            <h2>{title(record)}</h2>
            <time datetime={record.createdAt}
              >{formatChatTimestamp(record.createdAt)}</time
            >
          </header>
          {#if record.type === "handoff.summary.created"}<MarkdownContent
              content={record.summary}
              fullWidth
            />{/if}
          <Collapsible.Root>
            <Collapsible.Trigger class="jsonl-record__trigger"
              >View record <ChevronDownIcon
                aria-hidden="true"
              /></Collapsible.Trigger
            >
            <Collapsible.Content>
              <CodeBlock
                code={JSON.stringify(record, null, 2)}
                language="json"
                width="100%"
                size="sm"
                isCollapsible
                collapsibleThreshold={12}
                hasLineNumbers
              />
            </Collapsible.Content>
          </Collapsible.Root>
        </section>
      {/each}
    {:else}
      {#each preview.records as record (record.line)}
        <section class="jsonl-record" aria-label={`Line ${record.line}`}>
          <h2>Line {record.line}</h2>
          <CodeBlock
            code={JSON.stringify(record.value, null, 2)}
            language="json"
            width="100%"
            size="sm"
            isWrapped
            hasLineNumbers
            isCollapsible
            collapsibleThreshold={12}
          />
        </section>
      {/each}
    {/if}
  </div>
</ScrollArea>

<style>
  :global(.jsonl-records) {
    flex: 1;
    min-height: 0;
  }
  .jsonl-records__content {
    padding: 1rem;
    display: grid;
    gap: 0.75rem;
  }
  .jsonl-record {
    min-width: 0;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border);
  }
  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  h2 {
    margin: 0 0 0.5rem;
    font-size: 0.8125rem;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  time {
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }
  :global(.jsonl-record__trigger) {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font: inherit;
    font-size: 0.75rem;
    color: var(--muted-foreground);
    padding-block: 0.5rem;
  }
  :global(.jsonl-record__trigger svg) {
    width: 0.875rem;
    height: 0.875rem;
  }
  :global(.jsonl-record__trigger[data-state="open"] svg) {
    transform: rotate(180deg);
  }
</style>
