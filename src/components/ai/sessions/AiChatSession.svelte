<!-- SPDX-License-Identifier: Apache-2.0; application-owned inbox composition for live local chat. -->
<script lang="ts">
  import { onMount } from "svelte";
  import { AvatarGroup } from "@lapismd/design-core/shadcn/avatar";
  import { AuthorCard } from "@lapismd/design-core/shadcn/author-card";
  import { sessionAvatars } from "../../../lib/ai/presentation/session-avatars.ts";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import MessagesIcon from "@lucide/svelte/icons/messages-square";
  import DriveIcon from "@lucide/svelte/icons/hard-drive";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import type { TranscriptFrameProps } from "../../../lib/ai/chat/panel/transcript.ts";
  import type { ConversationListEntry } from "../../../lib/ai/conversations/transcript-store.ts";
  import type { ConversationLocation } from "../../../lib/ai/conversations/types.ts";
  import AiSessionShell from "./AiSessionShell.svelte";
  import TranscriptViewToggle from "./TranscriptViewToggle.svelte";
  import ChatConversationMenu from "../chat/ChatConversationMenu.svelte";
  import { profileLabel } from "../../../lib/ai/session-browser/model.ts";
  import { BackgroundWork } from "../../../lib/desktop/background-work.ts";

  let {
    panel,
    view,
    onViewChange,
    children,
    footer: composerFooter,
    toolInspector,
    headerActions,
    bodySidebar,
    bodySidebarOpen,
    mainInspector,
  }: TranscriptFrameProps = $props();
  const { panelProps, controller, composerState, actions } = $derived(panel);
  let rows = $state<ConversationListEntry[]>([]);
  let loaded = $state(false);
  const key = (location: ConversationLocation) =>
    JSON.stringify([location.scopeDir, location.conversationId]);
  const activeId = $derived(
    controller.location ? key(controller.location) : undefined,
  );
  const current = $derived(rows.find((row) => key(row.location) === activeId));
  const agent = $derived(
    (
      {
        codex: "Codex",
        cursor: "Cursor",
        opencode: "OpenCode",
        local: "Lapis AI",
      } as Record<string, string>
    )[composerState.selectedAgent] ?? composerState.selectedAgent,
  );
  const avatars = $derived(
    sessionAvatars(
      composerState.selectedAgent,
      composerState.recipients.selectedIds,
      composerState.recipientOptions,
      controller.bindings,
    ),
  );
  const items = $derived(
    rows.map((row) => ({
      id: key(row.location),
      title: row.metadata?.title ?? "Untitled conversation",
      path:
        [row.location.scopeDir, row.metadata?.launchContext?.notePath]
          .filter(Boolean)
          .join("/") || "Vault root",
      group: row.location.scopeDir || "Vault root",
      profile: row.metadata?.imported
        ? profileLabel(row.metadata.imported.source.profile)
        : "Local chat",
      updatedAt: row.metadata?.updatedAt ?? "",
      status: row.metadata?.status === "archived" ? "Archived" : undefined,
      harness: row.metadata?.imported
        ? "codex"
        : key(row.location) === activeId
          ? composerState.selectedAgent
          : undefined,
    })),
  );
  onMount(() => {
    const repository = panelProps.repository;
    if (!repository) {
      loaded = true;
      return;
    }
    let disposed = false,
      generation = 0;
    const refresh = () => {
      const request = ++generation;
      void actions.perform(async () => {
        try {
          const next = panelProps.app
            ? await new BackgroundWork(
                panelProps.app.notifications,
                "ai-session-list",
              ).run("Loading AI conversations", () => repository.listAll())
            : await repository.listAll();
          if (!disposed && request === generation) rows = next;
        } finally {
          if (!disposed && request === generation) loaded = true;
        }
      });
    };
    const unsubscribe = repository.subscribe(refresh);
    refresh();
    return () => {
      disposed = true;
      unsubscribe();
    };
  });
  function select(id: string) {
    const row = rows.find((entry) => key(entry.location) === id);
    if (row && !controller.busy)
      void actions.perform(() => controller.openConversation(row.location));
  }
  function create() {
    const scope =
      controller.directoryContext || controller.location?.scopeDir || "";
    void actions.perform(() =>
      controller.newConversation(
        panelProps.createConversation?.(scope) ?? { scopeDir: scope },
      ),
    );
  }
</script>

<AiSessionShell
  {items}
  {activeId}
  title={current?.metadata?.title ?? "New conversation"}
  status={`${agent} · ${composerState.selectedModel || "Automatic model"} · ${panel.conversationsState.scopePathLabel}`}
  label="Conversations"
  busy={controller.busy}
  loading={!loaded || !!panelProps.initializing}
  emptyTitle="No conversations yet"
  emptyDescription="Start a conversation to save a local chat."
  onSelect={select}
  harness={composerState.selectedAgent}
  showMainOnCompact
  initialListOpen={false}
  {toolInspector}
  {bodySidebar}
  {bodySidebarOpen}
  {mainInspector}
>
  {#snippet identity()}
    <AvatarGroup items={avatars} label="Chat agents" size="sm" max={4}>
      {#snippet avatar(person, size)}<AuthorCard
          author={person}
          trigger="avatar"
          interaction="hover"
          {size}
          role="Agent"
          label={`About ${person.name}`}
        />{/snippet}
    </AvatarGroup>
  {/snippet}
  {#snippet listActions()}<Button
      variant="ghost"
      size="icon-sm"
      aria-label="New conversation"
      disabled={!!panelProps.initializing || controller.busy}
      onclick={create}><PlusIcon aria-hidden="true" /></Button
    >{/snippet}
  {#snippet actions()}<TranscriptViewToggle
      {view}
      onChange={onViewChange}
    />{@render headerActions?.()}<ChatConversationMenu
      {panelProps}
      {controller}
      actions={panel.actions}
      {composerState}
    />{/snippet}
  {#snippet listFooter()}<footer class="ai-session-list-footer">
      <div class="ai-session-status-items">
        <span class="ai-session-status-item"
          ><MessagesIcon aria-hidden="true" />{rows.length} conversations</span
        >
        <span class="ai-session-status-item ai-session-status-item--end"
          ><DriveIcon aria-hidden="true" />Local</span
        >
      </div>
    </footer>{/snippet}
  {#snippet footer()}<footer class="ai-session-footer">
      <div class="chat-footer-controls">{@render composerFooter()}</div>
    </footer>{/snippet}
  {@render children()}
</AiSessionShell>

<style>
  .chat-footer-controls {
    width: 100%;
    min-width: 0;
    --spacing: 0.21875rem;
    --ui-transcript-footer-padding: 0;
    --ui-transcript-footer-gap: 0.25rem;
  }
</style>
