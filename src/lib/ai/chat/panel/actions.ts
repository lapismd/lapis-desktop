// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat presentation state; see ../../NOTICE.md.
import { runChatAction } from "./action-errors.ts";
import { catalogModelsForAgent } from "../../settings/acp-agents.ts";
import { toolCallStatus, type AiChatToolItem } from "../chat-tool-display.ts";
import {
  isOneLineToolAlert as isOneLineAlert,
  presentToolPayload,
  toolCallTarget,
} from "@lapismd/design-core/ai/chat";
import type { AiChatPanelProps } from "./props.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
import type { ComposerState } from "./composer.svelte.ts";
import type { AttachmentsState } from "./attachments.svelte.ts";
export function createChatPanelActions(
  getProps: () => AiChatPanelProps,
  controller: AiChatController,
  composer: ComposerState,
  attachmentState: AttachmentsState,
) {
  async function submit(prompt: string): Promise<void> {
    const { initializing = false, workspace, mcpServers = [] } = getProps();

    if (initializing || composer.catalogState?.loading) return;
    const selected = catalogModelsForAgent(
      composer.selectedAgent,
      composer.catalogModels,
    ).find((model) => model.model === composer.selectedModel);
    const extra = attachmentState.attachments.map((file) => file.path);
    attachmentState.attachments = [];
    attachmentState.drawerCollapsed = false;
    await controller.submit(prompt, {
      workspace,
      mcpServers,
      agent: composer.selectedAgent,
      model: composer.selectedModel
        ? {
            provider: selected?.provider ?? composer.selectedAgent,
            model: composer.selectedModel,
          }
        : undefined,
      thinking: composer.selectedThinking,
      metadata: {
        ...(extra.length > 0 ? { attachments: extra } : {}),
        runtime: composer.selectedRuntime,
      },
    });
  }
  async function copyResponse(text: string): Promise<void> {
    await navigator.clipboard.writeText(text);
  }
  function promptForError(errorId: string): string | null {
    const errorIndex = controller.items.findIndex(
      (item) => item.id === errorId,
    );
    for (let index = errorIndex - 1; index >= 0; index -= 1) {
      const item = controller.items[index];
      if (item?.type === "message" && item.role === "user") {
        return item.text;
      }
    }
    return null;
  }
  function formatTokenCount(value: number): string {
    return new Intl.NumberFormat().format(value);
  }
  function toolCallProps(item: AiChatToolItem) {
    const hint = { toolName: item.name, input: item.input };
    const presentedError =
      item.state === "error"
        ? presentToolPayload(item.output, hint)
        : undefined;
    return {
      id: item.toolId,
      name: item.name,
      status: toolCallStatus(item.state),
      errorMessage:
        presentedError && isOneLineAlert(presentedError)
          ? presentedError.code
          : undefined,
      target: toolCallTarget(item.input, item.server),
      data: {
        input: item.input,
        output: item.state === "error" ? undefined : item.output,
        error: item.state === "error" ? item.output : undefined,
        name: item.name,
      },
    };
  }

  const perform = (operation: () => unknown | Promise<unknown>) =>
    runChatAction(getProps, controller, operation);
  return {
    perform,
    submit: (prompt: string) => perform(() => submit(prompt)),
    copyResponse: (text: string) => perform(() => copyResponse(text)),
    promptForError,
    formatTokenCount,
    toolCallProps,
  };
}
export type ChatPanelActions = ReturnType<typeof createChatPanelActions>;
