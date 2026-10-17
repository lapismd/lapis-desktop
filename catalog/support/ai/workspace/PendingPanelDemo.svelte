<!-- SPDX-License-Identifier: Apache-2.0 -->
<script lang="ts">
  import { onMount, tick, untrack } from "svelte";
  import { App, MemoryAppDatabase, MemoryVaultAdapter } from "@lapis-notes/api";
  import AiHistoryPanel from "../../../../src/components/ai/history/AiHistoryPanel.svelte";
  import AiCatalogPanel from "../../../../src/components/ai/catalog/AiCatalogPanel.svelte";
  import AiChatPanel from "../../../../src/components/ai/chat/AiChatPanel.svelte";
  import { FakeAgentRuntime } from "../../../../tests/ai/support/fake-runtime.ts";
  import { AiOperations } from "../../../../src/lib/ai/plugin/operations.ts";
  import type { ConversationLocation } from "../../../../src/lib/ai/conversations/types.ts";
  import { ConversationRepository } from "../../../../src/lib/ai/conversations/conversation-repository.ts";
  import { VaultTranscriptStore } from "../../../../src/lib/ai/conversations/vault-transcript-store.ts";
  import type { AiHistoryProps } from "../../../../src/lib/ai/history/props.ts";
  import type { AiCatalogProps } from "../../../../src/lib/ai/catalog/props.ts";
  import { registerCatalogCleanup } from "../../lifecycle.ts";
  let { kind }: { kind: "history" | "catalog" | "chat" } = $props();
  const database = new MemoryAppDatabase(crypto.randomUUID());
  const app = new App({
    version: "0.1.0-catalog",
    configPath: ".lapis/app.json",
    adapter: new MemoryVaultAdapter({ ".lapis/app.json": "{}" }),
    appDatabase: database,
    markdownRenderer: async () => {},
  });
  const repository = new ConversationRepository(
    new VaultTranscriptStore(app.vault),
  );
  const chatWork = new AiOperations();
  const runtime = new FakeAgentRuntime({ id: "acp", resumeSupported: false });
  let initialLocation = $state<ConversationLocation | null>(null);
  let visible = $state(true);
  let ready = $state(false);
  let started = $state(false);
  let readFinished = $state(false);
  let disposalObserved = $state(false);
  let databaseClosed = $state(false);
  let failure = $state("");
  let operations = $state(0);
  let pending: Promise<void> | undefined;
  let pendingRead: Promise<void> | undefined;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const heldRead = () =>
    (pendingRead ??= (async () => {
      started = true;
      await gate;
      await database.listMemoryJobs();
      readFinished = true;
    })());
  const onDispose = (operation: Promise<void>) => {
    disposalObserved = true;
    pending = operation;
  };
  const chatCallbacks = {
    onOperation: (operation: Promise<void>) => {
      operations += 1;
      if (!visible) disposalObserved = true;
      chatWork.track(operation);
    },
  };
  const history: AiHistoryProps & { onDispose: typeof onDispose } = {
    app,
    repository,
    getScope: () => "",
    getActiveConversation: () => null,
    onOpenConversation: () => {},
    onNewConversation: () => {},
    listConversationFolders: () => [],
    searchAllConversations: async () => {
      await heldRead();
      return [];
    },
    onDispose,
  };
  const catalog: AiCatalogProps & { onDispose: typeof onDispose } = {
    app,
    loadCatalog: async () => {
      await heldRead();
      return [];
    },
    onToggleTool: async () => {},
    onOpenSkill: async () => {},
    onDispose,
  };
  const boot = untrack(async () => {
    await app.vault.load();
    await app.configuration.load();
    const created = await repository.create({ scopeDir: "Notes" });
    initialLocation = created.location;
    if (kind === "chat") {
      const read = repository.read.bind(repository);
      repository.read = async (location) => {
        await heldRead();
        return read(location);
      };
    }
    await app.workspace.changeLayout(app.workspace.getLayout());
  });
  let closing: Promise<void> | undefined;
  const closeResources = () =>
    (closing ??= (async () => {
      visible = false;
      await tick();
      await pending;
      await chatWork.settle();
      await database.close();
      databaseClosed = true;
    })());
  const cleanup = async () => {
    release();
    await boot;
    await pendingRead?.catch(() => {});
    await closeResources();
    await app.workspace.disposeWorkspaceHost();
    await app.fileEditingSessions.dispose();
    await app.metadataCache.dispose();
  };
  const unregister = registerCatalogCleanup(cleanup);
  onMount(() => {
    let disposed = false;
    void boot.then(() => {
      if (!disposed) ready = true;
    });
    return () => {
      disposed = true;
      unregister();
      void cleanup().catch(console.error);
    };
  });
</script>

<button
  onclick={() => {
    void closeResources().catch((error) => {
      failure = String(error);
    });
  }}>Close panel and database</button
>
<button onclick={() => release()}>Release pending read</button>
<output aria-label="Pending panel lifetime"
  >{JSON.stringify({
    started,
    readFinished,
    disposalObserved,
    databaseClosed,
    failure,
    operations,
  })}</output
>
{#if ready && visible}
  {#if kind === "history"}<AiHistoryPanel {...history} />
  {:else if kind === "chat"}<AiChatPanel
      {runtime}
      {repository}
      {initialLocation}
      {...chatCallbacks}
      onControllerDispose={onDispose}
    />
  {:else}<AiCatalogPanel {...catalog} />{/if}
{/if}
