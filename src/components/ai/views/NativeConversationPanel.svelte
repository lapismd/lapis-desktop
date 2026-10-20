<!-- SPDX-License-Identifier: Apache-2.0 -->
<script lang="ts">
  import { onMount } from "svelte";
  import type { App } from "@lapis-notes/api";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import HistoryIcon from "@lucide/svelte/icons/history";
  import type { AiApplication } from "../../../lib/ai/plugin/application.ts";
  import {
    nativeConversationReference,
    type NativeConversationReference,
  } from "../../../lib/ai/conversations/conversation-route.ts";
  import type { NativeConversationReaderLease } from "../../../lib/ai/conversations/native-workspace.ts";
  import type { NativeConversationReader } from "../../../lib/ai/conversations/native-reader.ts";
  import AiSessionShell from "../sessions/AiSessionShell.svelte";
  import NativeConversationBrowser from "../sessions/NativeConversationBrowser.svelte";
  import AiTranscriptLoading from "../chat/AiTranscriptLoading.svelte";
  import NativeChatPanel from "../sessions/NativeChatPanel.svelte";

  let {
    app,
    host,
    initialConversation,
    onConversationChange,
    chatEnabled = false,
  }: {
    app: App;
    host: AiApplication;
    initialConversation?: NativeConversationReference;
    onConversationChange: (reference: NativeConversationReference) => void;
    chatEnabled?: boolean;
  } = $props();
  let reader = $state<NativeConversationReader>(),
    failed = $state(false);
  let nativeLease = $state<NativeConversationReaderLease>();
  onMount(() => {
    let disposed = false;
    let lease: NativeConversationReaderLease | undefined;
    let unsubscribe: (() => void) | undefined;
    const opening = host.operations.track(
      host.nativeConversations.acquireReader(),
    );
    const initialized = opening.then(async (owned) => {
      lease = owned;
      if (disposed) return;
      reader = owned.reader;
      nativeLease = owned;
      unsubscribe = reader.subscribe((state) => {
        if (!disposed && !state.reading && state.conversation)
          onConversationChange(
            nativeConversationReference(state.conversation.identity),
          );
      });
      // A restored reference is independent of the current catalog page.
      // Each reader operation already reports its own failure through the App.
      await Promise.allSettled([
        ...(initialConversation
          ? [reader.selectRoute(initialConversation, chatEnabled)]
          : []),
        reader.refresh(),
      ]);
    });
    void host.operations.track(initialized).catch((error) => {
      if (disposed) return;
      failed = true;
      host.report(error);
    });
    return () => {
      disposed = true;
      unsubscribe?.();
      const closing = initialized.catch(() => {}).then(() => lease?.close());
      void host.operations.track(closing).catch((error) => host.report(error));
    };
  });
</script>

{#if nativeLease && chatEnabled && host.services.managedAgents}
  <NativeChatPanel {app} {host} lease={nativeLease} />
{:else if reader}
  <NativeConversationBrowser
    {app}
    {reader}
    agentOptions={host.getSettings().agentParticipants ?? []}
  />
{:else}
  <AiSessionShell
    items={[]}
    title="Native conversation"
    label="Conversations"
    loading={!failed}
    busy={!failed}
    emptyTitle={failed ? "History unavailable" : "Loading conversations"}
    emptyDescription="Native conversations use the explicitly selected JJ backend."
    onSelect={() => {}}
    showMainOnCompact
  >
    {#if failed}
      <Empty.Root>
        <Empty.Header>
          <Empty.Media variant="icon"
            ><HistoryIcon aria-hidden="true" /></Empty.Media
          >
          <Empty.Title>History unavailable</Empty.Title>
          <Empty.Description
            >Reopen this tab after checking the selected conversation storage.
            Your saved conversation reference is retained.</Empty.Description
          >
        </Empty.Header>
      </Empty.Root>
    {:else}<AiTranscriptLoading composer={false} />{/if}
  </AiSessionShell>
{/if}
