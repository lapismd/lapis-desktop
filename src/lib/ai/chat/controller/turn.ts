// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat orchestration; see ../../NOTICE.md.
import type { AgentContextBlock } from "../../core/context.ts";
import type { AgentRequest } from "../../core/runtime.ts";
import { buildConversationContextHandoff } from "../../conversations/context-handoff.ts";
import { reduceAgentBindings } from "../../conversations/binding-state.ts";
import { extractMentionPaths, mergeAttachmentPaths } from "../chat-mentions.ts";
import { type AiChatItem } from "../chat-items.ts";
import { attachmentContext } from "../attachment-context.ts";
import { applyAgentEventToChatItems } from "../chat-trace.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
export async function submit(
  this: AiChatController,
  prompt: string,
  request: Omit<AgentRequest, "prompt"> = {},
): Promise<boolean | undefined> {
  try {
    await this._syncSlashCatalog();
  } catch (error) {
    this.error = error instanceof Error ? error.message : String(error);
    this.items = [
      ...this.items,
      {
        id: `error-${crypto.randomUUID()}`,
        type: "error",
        text: this.error,
        createdAt: new Date().toISOString(),
      },
    ];
    return;
  }
  const resolution = this._slashRouter?.resolve(prompt, this._activeBindingId);
  if (resolution?.kind === "unknown" || resolution?.kind === "command") {
    await this._executeSlash(resolution, {
      ...this.request,
      ...request,
      metadata: { ...this.request.metadata, ...request.metadata },
    });
    return;
  }
  const text =
    resolution?.kind === "literal" ? resolution.text.trim() : prompt.trim();
  if ((!text && !request.contextBlocks?.length) || this.busy) return;
  this.error = null;
  const userItem: AiChatItem = {
    id: this.repository
      ? `user-${crypto.randomUUID()}`
      : `user-${this.items.length + 1}`,
    type: "message",
    role: "user",
    text,
    ...(request.contextBlocks?.length
      ? { contextBlocks: structuredClone(request.contextBlocks) }
      : {}),
    createdAt: new Date().toISOString(),
  };
  this.items = [...this.items, userItem];
  this.busy = true;
  const turnId = ++this._turnId;
  const attachments = mergeAttachmentPaths(
    extractMentionPaths(text),
    readAttachmentPaths(request.metadata?.attachments),
  );
  const effectiveRequest: Omit<AgentRequest, "prompt"> = {
    ...this.request,
    ...request,
    metadata: {
      ...this.request.metadata,
      ...request.metadata,
      ...(attachments.length > 0 ? { attachments } : {}),
    },
  };
  const previousRuntime = this.runtime;
  const previousBinding = this._activeBinding;
  const previousBindingId = this._activeBindingId;
  const previousSessionRequest = this._sessionRequest;
  try {
    if (this.repository) await this._ensureConversation();
    if (this._isAbandoned(turnId)) return;
    await this._prepareSession(effectiveRequest, turnId);
    if (this._isAbandoned(turnId)) return;
    if (this._activeBindingId) {
      this.items = this.items.map((item) =>
        item.id === userItem.id
          ? { ...item, agentBindingId: this._activeBindingId }
          : item,
      );
    }
    if (this.repository && this.location && this.session) {
      const context = this._sessionContexts.get(this.session) ?? {
        location: { ...this.location },
        pendingItems: [],
      };
      context.pendingItems.push(
        this.items.find((item) => item.id === userItem.id) ?? userItem,
      );
      this._sessionContexts.set(this.session, context);
    } else {
      await this._persist();
    }
    if (this._isAbandoned(turnId)) return;
    if (!this.session) {
      if (this.error) return;
      throw new Error("Agent session did not start.");
    }
    const session = this.session;
    const sharedPreparation =
      this.runtime.capabilities().preparesContext === true;
    const location = this.location ? { ...this.location } : null;
    const bindingId = this._activeBindingId;
    const authorized = () =>
      !this._isAbandoned(turnId) &&
      this.session === session &&
      this.location?.conversationId === location?.conversationId;
    const prepareContext = async (
      signal: AbortSignal,
    ): Promise<AgentContextBlock[]> => {
      if (!authorized())
        throw new Error("Conversation context is no longer active.");
      const recallAbort = new AbortController();
      const abort = () => recallAbort.abort();
      if (signal.aborted) abort();
      signal.addEventListener("abort", abort, { once: true });
      this._activeRecallAbort?.abort();
      this._activeRecallAbort = recallAbort;
      try {
        let handoff = this._pendingHandoffs.get(session);
        if (sharedPreparation && this.repository && location && bindingId) {
          const current = await this.repository.read(location);
          const bindings = reduceAgentBindings(current.agents);
          const binding = bindings.find((item) => item.id === bindingId);
          handoff = await buildConversationContextHandoff(current.transcript, {
            conversationId: current.metadata.id,
            targetBindingId: bindingId,
            ...(this._runtimeContextReady.has(session) && binding?.context
              ? {
                  after: {
                    entryId: binding.context.throughEntryId,
                    entryHash: binding.context.throughEntryHash,
                  },
                }
              : {}),
            bindings,
            summaries: current.agents.filter(
              (record) => record.type === "handoff.summary.created",
            ),
          });
          const context = this._sessionContexts.get(session);
          if (context) {
            context.handoff = handoff;
            if (context.pendingSwitch?.type === "agent.switch")
              Object.assign(context.pendingSwitch, {
                handoffId: handoff?.handoffId,
                handoffMode: handoff?.mode,
                handoffThroughEntryId: handoff?.throughEntryId,
                omittedEntryCount: handoff?.omittedEntryCount,
              });
          }
        }
        const recalledBlocks = await this._memoryRecall
          ?.recall(
            text,
            {
              scopeDir: location?.scopeDir ?? this.directoryContext,
              conversationId: location?.conversationId,
              agentBindingId: bindingId,
              runId: `turn-${turnId}`,
            },
            recallAbort.signal,
          )
          .catch(() => []);
        const files = await attachmentContext(
          attachments,
          this._readVaultText,
          recallAbort.signal,
        );
        if (recallAbort.signal.aborted || !authorized())
          throw new Error("Conversation preparation was cancelled.");
        this._pendingHandoffs.delete(session);
        return [
          ...(handoff ? [handoff.block] : []),
          ...files,
          ...(recalledBlocks ?? []),
          ...(effectiveRequest.contextBlocks ?? []),
        ];
      } finally {
        signal.removeEventListener("abort", abort);
        if (this._activeRecallAbort === recallAbort)
          this._activeRecallAbort = undefined;
      }
    };
    if (sharedPreparation) {
      await session.send(text, {
        prepareContext,
        authorizeContext: async () => authorized(),
      });
    } else {
      const blocks = await prepareContext(new AbortController().signal);
      if (this._isAbandoned(turnId)) return;
      await session.send(text, { contextBlocks: blocks });
    }
    if (!this.repository) await this._persist();
    return true;
  } catch (error) {
    if (this._isAbandoned(turnId)) return;
    const failedSession = this.session;
    const failedBindingId = this._activeBindingId;
    const failedContext = failedSession
      ? this._sessionContexts.get(failedSession)
      : undefined;
    if (
      failedContext?.pendingBinding ||
      failedContext?.pendingSwitch ||
      failedContext?.pendingConfiguration
    ) {
      this.runtime = previousRuntime;
      this._activeBinding = previousBinding;
      this._activeBindingId = previousBindingId;
      this._sessionRequest = previousSessionRequest;
      this.bindings = this.bindings.filter(
        (binding) => binding.id !== failedContext.pendingBinding?.id,
      );
      if (failedContext.pendingConfiguration) {
        this.bindings = this.bindings.map((binding) =>
          binding.id === failedContext.pendingConfiguration?.previous.id
            ? failedContext.pendingConfiguration.previous
            : binding,
        );
      }
    }
    this.error = error instanceof Error ? error.message : String(error);
    this.items = applyAgentEventToChatItems(this.items, {
      type: "error",
      error: error instanceof Error ? error : new Error(String(error)),
    });
    this.session = null;
    this.busy = false;
    await this._closeAppToolBinding(failedBindingId);
    await failedSession?.close().catch(() => undefined);
    try {
      if (this.repository) await this._ensureConversation();
      if (this.repository && this.location) {
        await this._appendDurableItems(
          this.location,
          [userItem, this.items.at(-1)!],
          this._activeBindingId,
        );
      } else {
        await this._persist();
      }
    } catch (persistError) {
      const persistMessage =
        persistError instanceof Error
          ? persistError.message
          : String(persistError);
      this.error = `${this.error} Could not save this turn: ${persistMessage}`;
    }
  }
}

export function waitForNextTask(): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, 0));
}

export function readAttachmentPaths(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}
