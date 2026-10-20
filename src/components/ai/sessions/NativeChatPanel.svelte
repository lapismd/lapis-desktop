<!-- SPDX-License-Identifier: Apache-2.0; embedded shell and shared production composer. -->
<script lang="ts">
  import { onMount, untrack, type Snippet } from "svelte";
  import { TranscriptFooter } from "@lapismd/design-core/chat";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Chat from "@lapismd/design-core/ai/chat";
  import type { App } from "@lapis-notes/api";
  import type { AiApplication } from "../../../lib/ai/plugin/application.ts";
  import type { NativeConversationReaderLease } from "../../../lib/ai/conversations/native-workspace.ts";
  import { NativeConversationChat } from "../../../lib/ai/chat/native-chat.ts";
  import { NativeChatDraft } from "../../../lib/ai/chat/native-draft.svelte.ts";
  import NativeConversationBrowser from "./NativeConversationBrowser.svelte";
  import ChatMessageComposer from "../chat/ChatMessageComposer.svelte";
  import ChatAgentSelector from "../chat/ChatAgentSelector.svelte";
  import ChatAgentOptions from "../chat/ChatAgentOptions.svelte";
  import AiApprovalCard from "../chat/AiApprovalCard.svelte";
  import AiQuestionCard from "../chat/AiQuestionCard.svelte";

  let {
    app,
    host,
    lease,
  }: { app: App; host: AiApplication; lease: NativeConversationReaderLease } =
    $props();
  let settings = $state(untrack(() => host.getSettings()));
  let read = $state(untrack(() => lease.reader.state));
  let documentActions = $state<Snippet>();
  let lastSubmission = "";
  const report = (error: unknown) => {
    if (host.active)
      app.notifications.notify({
        id: "ai-native-chat",
        title: "Native conversation",
        severity: "error",
        source: "ai",
        persist: false,
        message: error instanceof Error ? error.message : String(error),
      });
  };
  const context = $derived({
    app,
    settings,
    onSettingsChange: (patch: Parameters<typeof host.updateSettings>[0]) =>
      host.updateSettings(patch),
    loadModels: (agent: string, runtime?: string) =>
      host.models.listModels(agent, runtime),
  });
  const draft = untrack(
    () => new NativeChatDraft(() => context, host.workspace, report),
  );
  const chat = untrack(
    () =>
      new NativeConversationChat(
        lease.reader,
        host.services.conversationBackend!,
        lease.opened.handle,
        (pin, text, recipients) =>
          host.createManagedTurn(lease.opened, pin, text, recipients),
        () => host.getSettings().agentParticipants ?? [],
        report,
        () => host.active,
      ),
  );
  let chatState = $state<
    import("../../../lib/ai/chat/native-chat.ts").NativeChatState
  >(chat.state);
  const disabled = $derived(
    chatState.busy ||
      chatState.blocked ||
      chatState.authorshipUnknown ||
      !read.conversation ||
      read.reading,
  );
  $effect(() => {
    const thread = read.conversation?.identity.threadId;
    if (thread) untrack(() => draft.activate(thread));
  });
  onMount(() => {
    void draft.catalog.refresh("codex", "acp", draft.selectedModel);
    const unsubscribe = chat.subscribe((next) => {
      chatState = next;
    });
    const stopRead = lease.reader.subscribe((next) => {
      read = next;
    });
    const stopSettings = host.subscribeSettings(() => {
      settings = host.getSettings();
    });
    return () => {
      unsubscribe();
      stopRead();
      stopSettings();
      draft.catalog.cancel();
      void host.operations.track(chat.close()).catch(report);
    };
  });
  async function send() {
    if (disabled || !draft.draft.trim()) return;
    const text = draft.draft;
    try {
      const recipients = draft.snapshot();
      lastSubmission = text;
      if ((await chat.submit(text, recipients)) && draft.draft === text)
        draft.sent(text);
    } catch (error) {
      report(error);
    }
  }
  function toggle(id: string) {
    try {
      draft.toggleRecipient(id);
    } catch (error) {
      report(error);
    }
  }
  async function recover() {
    try {
      if ((await chat.recoverAuthorship()) && draft.draft === lastSubmission)
        draft.sent(lastSubmission);
    } catch (error) {
      report(error);
    }
  }
</script>

<NativeConversationBrowser
  {app}
  reader={lease.reader}
  agentOptions={draft.recipientOptions}
  composer={message}
  composerFooter={footer}
  liveItems={chatState.live}
  chatBusy={chatState.busy || chatState.blocked || chatState.authorshipUnknown}
  preferredView={settings.transcriptView}
  onViewChange={(view) =>
    void host.operations
      .track(host.updateSettings({ transcriptView: view }))
      .catch(report)}
/>

{#snippet interactions()}
  {#each chatState.pending as request (request.item.id)}
    {#if request.item.type === "approval"}
      <AiApprovalCard
        request={request.item.request}
        disabled={request.responding || chatState.stopping}
        onRespond={(option) =>
          void chat
            .respond(request.delivery, request.item.id, option)
            .catch(report)}
      />
    {:else if request.item.type === "question"}
      <AiQuestionCard
        request={request.item.request}
        disabled={!request.supported ||
          request.responding ||
          chatState.stopping}
        onRespond={(answers) =>
          void chat
            .respond(request.delivery, request.item.id, answers)
            .catch(report)}
      />
      {#if !request.supported}<p>
          This client cannot answer questions here. Stop this turn to continue.
        </p>{/if}
    {/if}
  {/each}
{/snippet}

{#snippet message(view: "document" | "classic")}
  <ChatMessageComposer
    bind:handle={draft.input}
    agentOptions={draft.recipientOptions}
    bind:value={draft.draft}
    bind:documentActions
    {view}
    {disabled}
    showHint={false}
    framedDrawer={view === "classic" && chatState.pending.length > 0}
    {drawer}
    triggers={draft.mentionTriggers}
    onSend={() => void send()}
  >
    {#snippet before()}
      {#if view === "document"}{@render drawer()}{/if}
    {/snippet}
  </ChatMessageComposer>
{/snippet}
{#snippet drawer()}
  {#if chatState.pending.length}<Chat.ComposerDrawer
      count={chatState.pending.length}
      label="Native agent requests"
    >
      {@render interactions()}
    </Chat.ComposerDrawer>{/if}
{/snippet}
{#snippet footer(_view: "document" | "classic")}
  <TranscriptFooter
    busy={chatState.busy || chatState.blocked}
    stopping={chatState.stopping}
    hasContent={!disabled && !!draft.draft.trim()}
    canSend={!disabled && !!draft.draft.trim()}
    sendPending={false}
    showStatus={false}
    onSend={send}
    onStop={chatState.busy || chatState.blocked
      ? () => chat.stop().catch(report)
      : undefined}
  >
    {#snippet actions()}{@render documentActions?.()}
      {#if chatState.authorshipUnknown}<Button
          variant="outline"
          size="sm"
          disabled={chatState.busy}
          onclick={() => void recover()}>Check original message</Button
        >{/if}
    {/snippet}
    {#snippet controls()}
      <ChatAgentSelector
        panelProps={context}
        options={draft.recipientOptions}
        selected={draft.recipients.selectedIds}
        busy={chatState.busy}
        onToggle={toggle}
        onAutoMentionChange={(value) =>
          draft.setAutomaticallyMentionAgents(value)}
      />
      <ChatAgentOptions composerState={draft} initializing={chatState.busy} />
    {/snippet}
  </TranscriptFooter>
{/snippet}
