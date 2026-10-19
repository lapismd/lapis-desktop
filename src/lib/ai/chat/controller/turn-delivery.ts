// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat orchestration; see ../../NOTICE.md.
import type { AgentContextBlock } from "../../core/context.ts";
import type { AgentRequest } from "../../core/runtime.ts";
import { buildConversationContextHandoff } from "../../conversations/context-handoff.ts";
import { reduceAgentBindings } from "../../conversations/binding-state.ts";
import { extractMentionPaths, mergeAttachmentPaths } from "../chat-mentions.ts";
import { type AiChatItem } from "../chat-items.ts";
import { attachmentContext } from "../attachment-context.ts";
import { prepareTurn, finishTurn, knownTurnError } from "./turn-checkpoint.ts";
import { applyAgentEventToChatItems } from "../chat-trace.ts";
import { publishCommentContext } from "./comment-publication.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
import { validateRecipients } from "../../conversations/recipients.ts";
import type { ActiveDelivery } from "./dispatch-state.ts";
export async function deliverTurn(
  this: AiChatController,
  userItem: AiChatItem,
  text: string,
  request: Omit<AgentRequest, "prompt">,
  turnId: number,
  dispatch?: ActiveDelivery,
): Promise<boolean | undefined> {
  const recipients = validateRecipients(request.recipients);
  const attachments = mergeAttachmentPaths(
    extractMentionPaths(text),
    readAttachmentPaths(request.metadata?.attachments),
  );
  const effectiveRequest: Omit<AgentRequest, "prompt"> = {
    ...this.request,
    ...request,
    ...(request.recipients ? { recipients } : {}),
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
    await this._prepareSession(effectiveRequest, turnId, dispatch?.user.id);
    if (this._isAbandoned(turnId)) return;
    if (!dispatch && this._activeBindingId) {
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
      context.delivery = dispatch;
      if (!dispatch)
        context.pendingItems.push(
          this.items.find((item) => item.id === userItem.id) ?? userItem,
        );
      context.accepted = false;
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
          handoff = await buildConversationContextHandoff(
            current.transcript.filter(
              (entry) => !dispatch || entry.id !== dispatch.user.id,
            ),
            {
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
            },
          );
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
        await prepareTurn(this, session, userItem);
        if (recallAbort.signal.aborted || !authorized())
          throw new DOMException(
            "Turn preparation was cancelled",
            "AbortError",
          );
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
    if (this._isAbandoned(turnId) || this.error) return false;
    if (!dispatch) await publishCommentContext(this, userItem, turnId);
    if (!this.repository) await this._persist();
    return true;
  } catch (error) {
    if (this._isAbandoned(turnId)) return;
    const failedSession = this.session;
    const failedBindingId = this._activeBindingId;
    const failedContext = failedSession
      ? this._sessionContexts.get(failedSession)
      : undefined;
    if (failedContext?.turn) {
      failedContext.turn.known = knownTurnError(error);
      failedContext.turn.outcome = failedContext.turn.known
        ? "rejected"
        : "unknown";
    }
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
    if (
      (failedContext?.turn && !knownTurnError(error)) ||
      (error instanceof Error &&
        "outcome" in error &&
        error.outcome === "unknown")
    )
      this.items = this.items.map((item, index) =>
        index === this.items.length - 1 && item.type === "error"
          ? { ...item, retryable: false }
          : item,
      );
    this.session = null;
    this.busy = false;
    await this._closeAppToolBinding(failedBindingId);
    await failedSession?.close().catch(() => undefined);
    try {
      if (this.repository) await this._ensureConversation();
      if (this.repository && this.location) {
        await this._appendDurableItems(
          this.location,
          [...(dispatch ? [] : [userItem]), this.items.at(-1)!],
          this._activeBindingId,
        );
      } else {
        await this._persist();
      }
      if (failedSession && failedContext?.turn) {
        await finishTurn(this, failedSession);
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

export function readAttachmentPaths(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}
