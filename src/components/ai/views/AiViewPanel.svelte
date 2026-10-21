<!-- SPDX-License-Identifier: Apache-2.0; retained Lapis AiView panel composition. -->
<script lang="ts">
  import { onMount } from "svelte";
  import type { App, WorkspaceLeaf } from "@lapis-notes/api";
  import type { ConversationLocation } from "../../../lib/ai/conversations/types.ts";
  import type { AiChatPanelProps } from "../../../lib/ai/chat/panel/props.ts";
  import AiChatPanel from "../chat/AiChatPanel.svelte";
  import type { AiApplication as AiViewHost } from "../../../lib/ai/plugin/application.ts";
  import {
    initialAiViewBootstrap,
    applyAiViewSettingsPatch,
    prepareAiViewBootstrap,
    type AiViewBootstrap,
  } from "../../../lib/ai/bootstrap/view-bootstrap.ts";

  let {
    app,
    host,
    workspaceLeaf,
    initialLocation,
    onConversationLocationChange,
    transcriptFrame,
  }: {
    app: App;
    host: AiViewHost;
    workspaceLeaf: WorkspaceLeaf;
    initialLocation: ConversationLocation | null;
    onConversationLocationChange: (
      location: ConversationLocation | null,
    ) => void;
    transcriptFrame?: AiChatPanelProps["transcriptFrame"];
  } = $props();

  const mcpServers = $derived(host.mcpServers.list());
  const initialBootstrap = $derived(initialAiViewBootstrap(host));
  let preparedBootstrap = $state<AiViewBootstrap | null>(null);
  const bootstrap = $derived(preparedBootstrap ?? initialBootstrap);
  let initializing = $state(true);

  onMount(() => {
    let disposed = false;
    const abort = new AbortController();
    const unsubscribe = host.subscribeSettings?.((patch) => {
      if (disposed || !preparedBootstrap) return;
      preparedBootstrap = {
        ...preparedBootstrap,
        settings: applyAiViewSettingsPatch(
          preparedBootstrap.settings,
          patch,
          host.getSettings(),
        ),
      };
    });
    void host.operations
      .track(
        prepareAiViewBootstrap(host, initialLocation, mcpServers, abort.signal),
      )
      .then((prepared) => {
        if (disposed) return;
        preparedBootstrap = prepared;
        initializing = false;
      })
      .catch((error) => {
        if (disposed) return;
        preparedBootstrap = {
          ...bootstrap,
          unavailableReason:
            error instanceof Error ? error.message : String(error),
        };
        initializing = false;
      });
    return () => {
      disposed = true;
      abort.abort();
      unsubscribe?.();
    };
  });
</script>

<AiChatPanel
  {transcriptFrame}
  {app}
  runtime={bootstrap.runtime}
  selectRuntime={(request) => host.selectRuntime(request)}
  unavailableReason={bootstrap.unavailableReason}
  {initializing}
  recordedImport={bootstrap.importedSnapshot}
  {mcpServers}
  appToolBridge={host.appToolBridge}
  skills={host.skills}
  skillSnapshots={host.skillSnapshots}
  slashRouter={host.slashRouter}
  appToolHost={host.appToolHost}
  memoryRecall={host.memory}
  handoffSummaries={host.handoffSummaries}
  skillContext={host.skillContext}
  workspace={host.workspace}
  repository={host.conversations}
  drafts={host.drafts}
  {initialLocation}
  createConversation={(explicitFolder) =>
    host.createConversationInput(explicitFolder)}
  onRevealHistory={() => host.revealConversationHistory()}
  subscribeConversationMoves={host.subscribeConversationMoves?.bind(host)}
  onControllerDispose={(operation) => {
    host.operations.track(operation);
  }}
  onOperation={(operation) => {
    host.operations.track(operation);
  }}
  {onConversationLocationChange}
  currentConversationScope={() => host.currentConversationScope()}
  listConversationFolders={() => host.listConversationFolders()}
  {workspaceLeaf}
  fileSearch={host.searchVaultFiles}
  models={bootstrap.models}
  agentProviders={host.services.agentProviders}
  loadExecutionModes={(agent, runtime, profileId) =>
    host.models.listExecutionModes?.(agent, runtime, profileId) ??
    Promise.resolve([])}
  loadModels={(agent, runtime, profileId) =>
    host.models.listModels(agent, runtime, profileId)}
  modelCatalogError={bootstrap.modelCatalogError}
  settings={bootstrap.settings}
  onSettingsChange={(patch) => host.updateSettings(patch)}
/>
