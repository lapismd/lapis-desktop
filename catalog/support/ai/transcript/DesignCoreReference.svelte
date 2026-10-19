<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import {
    Transcript,
    TranscriptController,
    MarkdownComposer,
    TranscriptFooter,
    MessageQueue,
    promptElementsExtension,
    type TranscriptQueuedMessage,
    type TranscriptTool,
  } from "@lapismd/design-core/chat";
  import { Avatar } from "@lapismd/design-core/shadcn/avatar";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { SegmentedControl } from "@lapismd/design-core/forms";
  import PaperclipIcon from "@lucide/svelte/icons/paperclip";
  import ReferenceControls from "./ReferenceControls.svelte";
  import ReferenceInspector from "./ReferenceInspector.svelte";
  import {
    designCoreReference,
    streamReference,
    toggleReferenceReaction,
  } from "./design-core-data.ts";
  let {
    initialView = "document",
    fill = false,
  }: { initialView?: "document" | "classic"; fill?: boolean } = $props();
  let view = $state(untrack(() => initialView));
  const author = { id: "reference-user", name: "You", initials: "YO" };
  const agent = {
    id: "assistant",
    name: "Assistant",
    initials: "AI",
    shape: "rounded" as const,
  };
  const reference = designCoreReference();
  let items = $state(
    reference.items.map((item, index) =>
      index
        ? item
        : {
            ...item,
            timestamp: "12:00",
            createdAt: "2026-10-08T12:00:00Z",
            edited: true,
            replyCount: 2,
            replyParticipants: [author, agent],
            sentContext: {
              content:
                "Demonstration context; delivery is not captured in this recording.\n\n<agent_context>\n## Review workspace\n\nKeep captured text **immutable**.\n</agent_context>",
              delivery: "unknown" as const,
            },
          },
    ),
  );
  let busy = $state(true),
    shown = $state(true),
    result = $state(""),
    inspected = $state<TranscriptTool>();
  let inputActions = $state<Snippet>();
  let agentLabel = $state("Codex");
  let reactions = $state<
    Record<string, { emoji: string; count: number; selected: boolean }[]>
  >({ [reference.items[0]!.id]: [{ emoji: "👍", count: 2, selected: false }] });
  let queued = $state<TranscriptQueuedMessage[]>([
    {
      id: "next-review",
      submission: {
        id: "next-review",
        author,
        text: "Demo queued message: after your current task, review the documentation too.",
        comments: [],
      },
      recipients: [{ id: "assistant", label: "Codex", state: "queued" }],
    },
  ]);
  const controller = new TranscriptController(
    () => ({
      items,
      author,
      canComment: true,
      canEditComment: () => true,
      onSend: async (snapshot) => {
        if (busy)
          queued = [
            ...queued,
            {
              id: snapshot.id,
              submission: snapshot,
              recipients: [
                { id: "assistant", label: agentLabel, state: "queued" },
              ],
            },
          ];
        result = snapshot.comments.length
          ? `${snapshot.comments.length} comments submitted`
          : "Message submitted";
        const publication = busy ? ("queued" as const) : ("published" as const);
        busy = true;
        return {
          publication,
          batchId: snapshot.id,
          commentVersions: Object.fromEntries(
            snapshot.comments.map((c) => [c.commentId, `demo-${snapshot.id}`]),
          ),
        };
      },
    }),
    reference.threads.map((thread) => ({
      ...thread,
      comments: thread.comments.map((comment) => ({
        ...comment,
        version: "demo-v1",
      })),
    })),
  );
  function stream() {
    items = streamReference(items);
  }
</script>

<div class="transcript-fixture" data-fill={fill || undefined}>
  <div class="transcript-fixture-actions">
    <small class="transcript-fixture-provenance"
      >Recorded Delta session: Add configurable screen lock overlay · 30
      captured tools. Metadata, review comments, replies and queue are
      demonstrations.</small
    >
    <SegmentedControl
      value={view}
      options={["document", "classic"]}
      labels={{ document: "Document", classic: "Classic" }}
      ariaLabel="Conversation view"
      onChange={(next) => {
        if (next === "document" || next === "classic") view = next;
      }}
    />
    <Button variant="outline" onclick={stream}>Stream update</Button>
    <Button
      variant="outline"
      onclick={() => {
        result = "History is already captured in this reference.";
      }}>Prepend history</Button
    >
    <Button
      variant="outline"
      onclick={() => {
        shown = !shown;
      }}>Toggle transcript</Button
    >
    <output>{controller.error || result}</output>
  </div>
  <div class="transcript-fixture-reader">
    {#if shown}<Transcript
        {items}
        {view}
        commentState={controller}
        {reactions}
        markdown={{ extensions: [promptElementsExtension] }}
        onInspectTool={(tool) => {
          inspected = tool;
        }}
        authorPopover={{
          interaction: "hover",
          description: (member) =>
            member.name === "You"
              ? "Project maintainer · Available"
              : "Assistant · Host-supplied model",
          actions: (member) => [
            {
              id: "profile",
              label: "View profile",
              onSelect: () => {
                result = `Profile: ${member.name}`;
              },
            },
            {
              id: "message",
              label: "Message",
              onSelect: () => {
                result = `Message: ${member.name}`;
              },
            },
          ],
        }}
        onOpenThread={(item) => {
          result = `Open replies for ${item.label}`;
        }}
        onReact={(target, emoji) => {
          reactions = toggleReferenceReaction(reactions, target, emoji);
        }}
      >
        {#snippet queuedMessages()}<MessageQueue
            entries={queued}
            onCancel={(entry, recipient) => {
              queued = queued.map((item) =>
                item.id === entry.id
                  ? {
                      ...item,
                      recipients: item.recipients.map((r) =>
                        r.id === recipient.id ? { ...r, cancelling: true } : r,
                      ),
                    }
                  : item,
              );
              result = "Cancellation requested; awaiting host confirmation";
            }}
          />{/snippet}
        {#snippet footer()}<TranscriptFooter
            state={controller}
            {busy}
            onStop={() => {
              busy = false;
              result = "Agent stopped";
            }}
          >
            {#snippet actions()}{@render inputActions?.()}<Button
                variant="ghost"
                size="icon-sm"
                aria-label="Attach context"
                onclick={() => {
                  result = "Host context action requested";
                }}><PaperclipIcon /></Button
              >{/snippet}
            {#snippet controls()}<ReferenceControls bind:agentLabel />{/snippet}
          </TranscriptFooter>{/snippet}
        {#snippet composer(currentView)}<MarkdownComposer
            bind:value={controller.message}
            dockActions
            bind:documentActions={inputActions}
            submitOnEnter={false}
            presentation={currentView === "document" ? "document" : "framed"}
            showSendButton={false}
            disabled={controller.sending || !!controller.retainedSubmission}
            onSubmit={() => {
              void controller.send();
            }}
          >
            {#snippet avatar()}<Avatar
                id={author.id}
                name={author.name}
                initials={author.initials}
                decorative
                style="--ui-avatar-size: 1.5rem"
              />{/snippet}
          </MarkdownComposer>{/snippet}
      </Transcript>{/if}
  </div>
  {#if inspected}<ReferenceInspector
      tool={inspected}
      state={controller}
      onClose={() => {
        inspected = undefined;
      }}
    />{/if}
</div>

<style>
  .transcript-fixture {
    height: min(48rem, calc(100vh - 2rem));
    min-height: 28rem;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    max-width: 100%;
    color: var(--foreground);
    background: var(--background);
  }
  .transcript-fixture-provenance {
    flex-basis: 100%;
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }
  .transcript-fixture[data-fill] {
    box-sizing: border-box;
    padding-block-end: 0.75rem;
    height: 100%;
    min-height: 0;
  }
  .transcript-fixture-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.5rem;
    border-bottom: 1px solid var(--border);
  }
  .transcript-fixture-reader {
    min-height: 0;
  }
  @container transcript-footer (max-width: 24rem) {
    :global(.transcript-fixture-choice span) {
      display: none;
    }
  }
  output {
    font-size: 0.875rem;
    align-self: center;
  }
</style>
