// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat presentation state; see ../../NOTICE.md.
import { untrack } from "svelte";
import { normalizeAcpAgent } from "../../settings/acp-agents.ts";
import { AiChatController } from "../chat-controller.svelte.ts";
import type { AiChatPanelProps } from "./props.ts";
export function createChatPanelController(
  props: AiChatPanelProps,
  onComposerDefaults: NonNullable<
    NonNullable<
      ConstructorParameters<typeof AiChatController>[3]
    >["onComposerDefaults"]
  >,
): AiChatController {
  const {
    app,
    runtime,
    selectRuntime,
    unavailableReason = null,
    workspace,
    mcpServers = [],
    appToolBridge,
    skills,
    skillSnapshots,
    slashRouter,
    appToolHost,
    memoryRecall,
    handoffSummaries,
    skillContext,
    sessionStore,
    sessionId,
    repository,
    initialLocation = null,
    createConversation,
    onConversationLocationChange,
    settings,
  } = props;
  return untrack(
    () =>
      new AiChatController(runtime, unavailableReason, mcpServers, {
        store: sessionStore,
        sessionId,
        workspace,
        request: {
          agent: settings?.acpAgent,
          model: settings?.defaultModel
            ? {
                provider: normalizeAcpAgent(settings?.acpAgent),
                model: settings.defaultModel,
              }
            : undefined,
          thinking: settings?.thinking,
          metadata: {
            runtime: settings?.defaultRuntime,
          },
        },
        repository,
        location: initialLocation,
        createConversation: (explicitFolder) =>
          createConversation?.(explicitFolder) ?? {
            scopeDir: explicitFolder ?? "",
          },
        onLocationChange: onConversationLocationChange,
        selectRuntime,
        appToolBridge,
        skills,
        skillSnapshots,
        slashRouter,
        appToolHost,
        memoryRecall: settings?.memoryAutomaticRecall
          ? memoryRecall
          : undefined,
        handoffSummaries,
        skillContext,
        readVaultText: app
          ? async (path) => {
              const file = app.vault.getFileByPath(path);
              return file ? app.vault.cachedRead(file) : undefined;
            }
          : undefined,
        onComposerDefaults,
      }),
  );
}
