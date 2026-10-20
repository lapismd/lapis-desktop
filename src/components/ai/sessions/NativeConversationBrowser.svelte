<script lang="ts">
  import { onMount, untrack, type Snippet } from "svelte";
  import type { App } from "@lapis-notes/api";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import HistoryIcon from "@lucide/svelte/icons/history";
  import LockIcon from "@lucide/svelte/icons/lock-keyhole";
  import { NativeConversationReader } from "../../../lib/ai/conversations/native-reader.ts";
  import { nativeConversationTitle } from "../../../lib/ai/conversations/native-view.ts";
  import { nativeCreatedAt } from "../../../lib/ai/chat/native-thread-projection.ts";
  import AiSessionShell from "./AiSessionShell.svelte";
  import AiRecordedTranscript from "./AiRecordedTranscript.svelte";
  import AiTranscriptLoading from "../chat/AiTranscriptLoading.svelte";
  import TranscriptViewToggle from "./TranscriptViewToggle.svelte";
  import AiSessionMenu from "./AiSessionMenu.svelte";
  import NativeConversationSourcePicker from "./NativeConversationSourcePicker.svelte";
  import type { TranscriptItem } from "@lapismd/design-core/chat";
  let {
    app,
    reader,
    composer,
    composerFooter,
    liveItems = [],
    chatBusy = false,
    preferredView,
    onViewChange,
  }: {
    app: App;
    reader: NativeConversationReader;
    composer?: Snippet<["document" | "classic"]>;
    composerFooter?: Snippet<["document" | "classic"]>;
    liveItems?: TranscriptItem[];
    chatBusy?: boolean;
    preferredView?: "document" | "classic";
    onViewChange?: (view: "document" | "classic") => void;
  } = $props();
  let readerState = $state(untrack(() => reader.state)),
    view = $state<"document" | "classic">(
      untrack(() => preferredView ?? "document"),
    ),
    toolInspector = $state<Snippet>();
  onMount(() =>
    reader.subscribe((next) => {
      readerState = next;
    }),
  );
  const selected = $derived(readerState.conversation);
  const busy = $derived(
    readerState.reading || readerState.catalog.busy || chatBusy,
  );
  const items = $derived(
    (readerState.catalog.page?.conversations ?? []).map((row) => ({
      id: row.threadId,
      title: row.title,
      profile: "Native JJ",
      group:
        row.target.type === "recorded" ? "Recorded sessions" : "Conversations",
      updatedAt: nativeCreatedAt(row.updatedAtMillis) ?? "",
      status: row.status,
    })),
  );
  const sources = $derived([
    {
      value: "history",
      label: "Complete conversation",
      description: "Authored messages and all recorded sessions",
    },
    {
      value: "thread",
      label: "Authored messages",
      description: "Messages written directly in this conversation",
    },
    ...(selected?.recordSources ?? []).map((source) => ({
      value: source.cursor,
      label: `${source.integration === "owned_controller" ? "Recorded session" : source.integration} · ${source.sessionId.slice(0, 4)}…${source.sessionId.slice(-4)}`,
      description: `Retained activity · ${source.sessionId}`,
    })),
  ]);
  const currentSource = $derived(
    selected?.recordSources.find(
      (source) => source.cursor === readerState.source,
    ),
  );
  const coverage = $derived(currentSource?.coverage);
  const loading = $derived(
    readerState.reading ||
      (readerState.catalog.phase === "loading" && !readerState.catalog.page),
  );
  const run = (work: Promise<void>) => {
    void work.catch(() => {});
  };
</script>

<AiSessionShell
  {items}
  activeId={selected?.identity.threadId}
  title={selected
    ? nativeConversationTitle(selected.view)
    : "Native conversations"}
  status={selected
    ? `${selected.view.header.status} · Pinned local history`
    : "Committed local conversations"}
  label="Native conversations"
  harness={currentSource?.integration === "owned_controller"
    ? "Recorded agent"
    : (currentSource?.integration ?? "Native conversation")}
  loading={readerState.catalog.phase === "loading" && !readerState.catalog.page}
  {busy}
  emptyTitle={readerState.catalog.phase === "error"
    ? "History unavailable"
    : "No native conversations"}
  emptyDescription={readerState.catalog.phase === "error"
    ? "Refresh to try loading this repository again."
    : "Conversations committed to this JJ backend will appear here."}
  onSelect={(id) => {
    if (!busy) run(reader.select(id));
  }}
  {toolInspector}
>
  {#snippet actions()}<TranscriptViewToggle
      bind:view
      onChange={onViewChange}
    /><AiSessionMenu
      {busy}
      refreshLabel="Refresh native conversations"
      onRefresh={() => run(reader.refresh())}
    />{/snippet}
  {#snippet listFooter()}<footer class="ai-session-list-footer">
      <div class="ai-session-status-items">
        <span class="ai-session-status-item"
          ><HistoryIcon aria-hidden="true" />{items.length} conversations</span
        >
        {#if readerState.catalog.page?.nextCursor}<Button
            variant="ghost"
            size="xs"
            disabled={busy}
            onclick={() => run(reader.more())}>Load more</Button
          >{/if}
      </div>
    </footer>{/snippet}
  {#snippet footer()}<footer class="ai-session-footer">
      <div class="ai-session-status-items">
        {#if selected}<div class="native-source-picker">
            <NativeConversationSourcePicker
              {sources}
              value={readerState.source}
              disabled={busy}
              onSelect={(value) => run(reader.selectSource(value))}
            />
          </div>{/if}
        {#if coverage}<span
            class="ai-session-status-item"
            title={`Source coverage: ${coverage.completeness}; ${coverage.gaps} gaps; ${coverage.redacted_fields} redacted fields; truncated: ${coverage.truncated}`}
            >{coverage.completeness === "complete"
              ? "Complete source"
              : coverage.completeness === "partial"
                ? "Partial source"
                : "Unknown coverage"}</span
          >{/if}
        {#if !composer}<span
            class="ai-session-status-item ai-session-status-item--end"
            ><LockIcon aria-hidden="true" />Read-only</span
          >{/if}
      </div>
      {#if composerFooter}<div class="chat-footer-controls">
          {@render composerFooter(view)}
        </div>{/if}
    </footer>{/snippet}
  {#if loading}<AiTranscriptLoading composer={false} />
  {:else if selected && (readerState.items.length || liveItems.length || composer)}<AiRecordedTranscript
      {app}
      projectedItems={[...readerState.items, ...liveItems]}
      {composer}
      busy={chatBusy}
      bind:view
      showViewToolbar={false}
      capturedUser={false}
      inspectTools
      bind:toolInspector
      label="Native conversation snapshot"
    />
  {:else}<Empty.Root
      ><Empty.Header
        ><Empty.Media variant="icon"
          ><HistoryIcon aria-hidden="true" /></Empty.Media
        ><Empty.Title
          >{selected
            ? "No messages in this source"
            : readerState.catalog.phase === "error" || readerState.error
              ? "History unavailable"
              : "Choose a conversation"}</Empty.Title
        ><Empty.Description
          >{selected
            ? "Choose another retained origin from the footer to inspect its messages and tools."
            : readerState.catalog.phase === "error" || readerState.error
              ? "Refresh and choose a conversation to try again."
              : "Choose a conversation on the left to read its committed history."}</Empty.Description
        ></Empty.Header
      ></Empty.Root
    >{/if}
</AiSessionShell>

<style>
  .native-source-picker {
    min-width: 0;
    max-width: min(22rem, 65%);
  }
  .chat-footer-controls {
    width: 100%;
    min-width: 0;
    --spacing: 0.21875rem;
    --ui-transcript-footer-padding: 0;
    --ui-transcript-footer-gap: 0.25rem;
  }
</style>
