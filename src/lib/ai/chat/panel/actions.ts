// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat presentation state; see ../../NOTICE.md.
import { queuedRequest } from "./queue-routing.ts";
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
  let submissionRefused = false;
  const queueError = (error: unknown) => {
    controller.error = null;
    getProps().app?.notifications.notify({
      id: "ai-queue-error",
      source: "ai",
      severity: "error",
      title: "AI messages",
      message: error instanceof Error ? error.message : String(error),
    });
  };
  controller.queuedMessages.configure(
    (q) => queuedRequest(q, getProps(), composer.recipientOptions),
    queueError,
  );
  controller.publication.configure(queueError);
  async function submit(
    prompt: string,
    contextBlocks?: import("../../core/context.ts").AgentContextBlock[],
  ): Promise<boolean | undefined> {
    submissionRefused = false;
    const { initializing = false, workspace, mcpServers = [] } = getProps();

    if (initializing || composer.catalogState?.loading) return;
    const addressed = composer.recipients.snapshot();
    const agent = addressed?.agent ?? composer.selectedAgent;
    const selected = catalogModelsForAgent(agent, composer.catalogModels).find(
      (model) => model.model === composer.selectedModel,
    );
    const extra = attachmentState.attachments.map((file) => file.path);
    const request = {
      ...(addressed
        ? {
            recipients: addressed.recipients,
            ...(addressed.recipients.length > 1
              ? {
                  deliveryTargets: addressed.options.map((option, i) => {
                    const model = catalogModelsForAgent(
                      option.agent,
                      composer.catalogModels,
                    ).find((m) => m.model === composer.selectedModel);
                    return {
                      recipient: addressed.recipients[i]!,
                      request: {
                        agent: option.agent,
                        model: model
                          ? { provider: model.provider, model: model.model }
                          : undefined,
                      },
                    };
                  }),
                }
              : {}),
          }
        : {}),
      contextBlocks,
      workspace,
      mcpServers,
      agent,
      model: composer.selectedModel
        ? {
            provider: selected?.provider ?? agent,
            model: composer.selectedModel,
          }
        : undefined,
      thinking: composer.selectedThinking,
      metadata: {
        ...(extra.length > 0 ? { attachments: extra } : {}),
        runtime: composer.selectedRuntime,
      },
    };
    let accepted: boolean | undefined;
    try {
      accepted = controller.repository
        ? controller.busy ||
          controller.publication.inFlight ||
          controller.queuedMessages.pending.length
          ? await controller.queuedMessages.enqueue(prompt, request)
          : await controller.publication.submit(prompt, request)
        : await controller.submit(prompt, request);
    } catch (error) {
      submissionRefused =
        error instanceof Error &&
        "outcome" in error &&
        error.outcome === "rejected";
      queueError(error);
      return false;
    }
    if (accepted === true) {
      attachmentState.attachments = attachmentState.attachments.filter(
        (file) => !extra.includes(file.path),
      );
      attachmentState.drawerCollapsed = false;
    }
    if (
      accepted === true &&
      addressed &&
      composer.recipients.matches(addressed.recipients.map((r) => r.id))
    )
      composer.recipients.remove();
    if (addressed && addressed.recipients.length > 1) {
      if (accepted === true)
        await getProps().app?.notifications.clear(
          "ai-addressed-delivery-error",
        );
      else if (controller.error) {
        const message = controller.error;
        controller.error = null;
        getProps().app?.notifications.notify({
          id: "ai-addressed-delivery-error",
          title: "AI",
          source: "ai",
          severity: "error",
          message,
        });
      }
    }
    return accepted;
  }
  async function copyResponse(text: string): Promise<void> {
    await navigator.clipboard.writeText(text);
  }
  function promptForError(errorId: string): string | null {
    const errorIndex = controller.items.findIndex(
      (item) => item.id === errorId,
    );
    const error = controller.items[errorIndex];
    if (error?.type === "error" && error.retryable === false) return null;
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
    submissionWasRefused: () => submissionRefused,
    resumeQueue: () =>
      perform(async () => {
        try {
          await controller.queuedMessages.resume();
        } catch (e) {
          queueError(e);
        }
      }),
    cancelQueued: (id: string) =>
      perform(async () => {
        try {
          await controller.queuedMessages.cancel(id);
        } catch (e) {
          queueError(e);
        }
      }),
    submit: (
      prompt: string,
      contextBlocks?: import("../../core/context.ts").AgentContextBlock[],
    ) => perform(() => submit(prompt, contextBlocks)),
    submitTranscript: async (
      prompt: string,
      contextBlocks: import("../../core/context.ts").AgentContextBlock[],
    ) => {
      let acknowledged = false;
      await perform(async () => {
        acknowledged = (await submit(prompt, contextBlocks)) === true;
      });
      return acknowledged;
    },
    copyResponse: (text: string) => perform(() => copyResponse(text)),
    promptForError,
    formatTokenCount,
    toolCallProps,
  };
}
export type ChatPanelActions = ReturnType<typeof createChatPanelActions>;
