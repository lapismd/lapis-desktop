// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat orchestration; see ../../NOTICE.md.
import type { AgentSession } from "../../core/runtime.ts";
import type { AgentUsage } from "../../core/models.ts";
import { transcriptEntryHash } from "../../conversations/hashes.ts";
import { persistentDecisionForRequest } from "../../conversations/approval-grants.ts";
import { CONVERSATION_SCHEMA_VERSION } from "../../conversations/types.ts";
import { type AiChatItem } from "../chat-items.ts";
import {
  applyAgentEventToChatItems,
  isVisibleAgentStatus,
} from "../chat-trace.ts";
import { APP_TOOL_MCP_SERVER_NAME } from "../../tools/mcp-server-registry.ts";
import type { AppToolBridgeEvent } from "../../tools/app-tool-bridge.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
import { waitForNextTask } from "./turn.ts";
import { StreamingChatTrace } from "./streaming-trace.ts";
import {
  finishTurn,
  knownTurnError,
  retainUnknownTurn,
} from "./turn-checkpoint.ts";
export async function _consume(
  this: AiChatController,
  session: AgentSession,
  agentBindingId = this._activeBindingId,
): Promise<void> {
  const context = this._sessionContexts.get(session) ?? {
    location: this.location ? { ...this.location } : null,
    pendingItems: [],
  };
  this._sessionContexts.set(session, context);
  const live = new StreamingChatTrace(
    () => this.items,
    (items) => {
      this.items = items.map((item) =>
        item.agentBindingId || !agentBindingId
          ? item
          : { ...item, agentBindingId },
      );
    },
    () =>
      this.session === session &&
      !this._disposed &&
      !this._cancelledSessions.has(session),
  );
  this._flushSessionTrace.set(session, () => live.flush());
  let traceItems: AiChatItem[] = [];
  let latestUsage: AgentUsage | null = null;
  const persistCompletedTrace = async () => {
    traceItems = retainUnknownTurn(this, session, traceItems);
    if (
      traceItems.length === 0 &&
      !latestUsage &&
      !context.pendingBinding &&
      !context.pendingSwitch &&
      !context.pendingConfiguration &&
      !context.turn &&
      context.pendingItems.length === 0
    ) {
      return;
    }
    await waitForNextTask();
    if (this.repository && context.location) {
      if (context.accepted && context.pendingBinding) {
        await this.repository.appendAgentRecords(context.location, [
          context.pendingBinding,
        ]);
      }
      if (context.accepted && context.pendingActivationBindingId) {
        await this.repository.activateBinding(
          context.location,
          context.pendingActivationBindingId,
          context.pendingSwitch,
        );
      } else if (context.accepted && context.pendingSwitch) {
        await this.repository.appendTranscript(context.location, [
          context.pendingSwitch,
        ]);
      }
      if (context.accepted && context.pendingConfiguration) {
        await this.repository.appendAgentRecords(context.location, [
          context.pendingConfiguration.agentRecord,
        ]);
        await this.repository.appendTranscript(context.location, [
          context.pendingConfiguration.transcriptEntry,
        ]);
      }
      await this._appendDurableItems(
        context.location,
        [...context.pendingItems, ...traceItems],
        agentBindingId,
        false,
        false,
        agentBindingId,
      );
      if (latestUsage && agentBindingId) {
        await this._appendUsage(context.location, agentBindingId, latestUsage);
      }
      if (agentBindingId) {
        const checkpoint = await this.repository.read(context.location);
        const through = checkpoint.transcript.at(-1);
        if (through) {
          await this.repository.appendAgentRecords(context.location, [
            {
              schemaVersion: CONVERSATION_SCHEMA_VERSION,
              id: `context-${crypto.randomUUID()}`,
              type: "binding.context.updated",
              createdAt: new Date().toISOString(),
              agentBindingId,
              throughEntryId: through.id,
              throughEntryHash: await transcriptEntryHash(through),
              cause: context.handoff ? "handoff" : "native-turn",
              handoffId: context.handoff?.handoffId,
              projectionMode: context.handoff?.mode,
              omittedEntryCount: context.handoff?.omittedEntryCount,
            },
          ]);
        }
      }
      if (!this._disposed && this._handoffSummaries) {
        const summaries = this._handoffSummaries;
        const location = context.location;
        void this._backgroundWork
          .run(() => summaries.afterTerminal(location))
          .catch(() => undefined);
      }
    } else {
      await this._persist(false, agentBindingId);
    }
    await finishTurn(this, session);
    context.pendingBinding = undefined;
    context.pendingSwitch = undefined;
    context.pendingActivationBindingId = undefined;
    context.pendingConfiguration = undefined;
    context.handoff = undefined;
    context.pendingItems = [];
    traceItems = [];
    latestUsage = null;
  };
  const checkpointTrace = (): Promise<void> => {
    const checkpoint = persistCompletedTrace();
    this._terminalCheckpoint = checkpoint.catch(() => undefined);
    return checkpoint;
  };
  try {
    for await (const event of session.events()) {
      if (event.type === "completed") this._runtimeContextReady.add(session);
      if (
        (event.type === "tool.start" || event.type === "tool.end") &&
        event.server === APP_TOOL_MCP_SERVER_NAME
      ) {
        continue;
      }
      if (event.type === "usage") {
        latestUsage = { ...event.usage };
        if (this.session === session) this.usage = latestUsage;
        continue;
      }
      if (event.type === "status" && !isVisibleAgentStatus(event.status)) {
        continue;
      }
      if (event.type === "commands.update") {
        if (agentBindingId) {
          this._slashRouter?.catalog.replaceNativeCommands(
            agentBindingId,
            event.commands,
          );
        }
        continue;
      }
      if (event.type === "permission.request") {
        const decision = persistentDecisionForRequest(
          this._approvalGrants,
          event.request,
        );
        const option = event.request.options.find(
          (option) => option.kind === decision,
        );
        if (decision && option) {
          try {
            await waitForNextTask();
            if (
              this.session === session &&
              !this._cancelledSessions.has(session)
            ) {
              await session.respondToApproval(event.request.id, option.id);
              continue;
            }
          } catch {
            // Fall through so an unmatched runtime request still opens the drawer.
          }
        }
      }
      if (
        [
          "text",
          "message_complete",
          "thinking",
          "tool.start",
          "tool.end",
          "permission.request",
          "question.request",
          "completed",
        ].includes(event.type)
      )
        context.accepted = true;
      if (context.turn && event.type === "completed") context.turn.known = true;
      if (context.turn && event.type === "error")
        context.turn.known = knownTurnError(event.error);
      traceItems = applyAgentEventToChatItems(traceItems, event);
      const activeSession = this.session === session;
      const cancelled = this._cancelledSessions.has(session);
      if (activeSession && !cancelled) {
        live.receive(event);
      }
      if (event.type === "completed" || event.type === "error") {
        if (event.type === "error" && activeSession) {
          this.error = event.error.message;
        }
      }
      if (
        activeSession &&
        (event.type === "completed" || event.type === "error")
      ) {
        this.busy = false;
      }
      if (event.type === "completed" || event.type === "error") {
        await checkpointTrace();
      }
      if (event.type === "error") {
        if (this.session === session) this.session = null;
        await session.close().catch(() => undefined);
        await this._closeAppToolBinding(agentBindingId);
        break;
      }
    }
  } catch (error) {
    live.flush();
    if (context.turn) context.turn.known = knownTurnError(error);
    const normalized =
      error instanceof Error ? error : new Error(String(error));
    const errorEvent = {
      type: "error",
      error: normalized,
    } as const;
    traceItems = applyAgentEventToChatItems(traceItems, errorEvent);
    if (this.session === session) {
      this.error = normalized.message;
      this.items = applyAgentEventToChatItems(this.items, errorEvent);
      this.busy = false;
    }
    await checkpointTrace();
    if (this.session === session) this.session = null;
    await session.close().catch(() => undefined);
    await this._closeAppToolBinding(agentBindingId);
  } finally {
    live.flush();
    live.clear();
    this._flushSessionTrace.delete(session);
    if (this.session === session) this.busy = false;
    await checkpointTrace();
    this._sessionContexts.delete(session);
  }
}

export async function _consumeAppToolEvent(
  this: AiChatController,
  { bindingId, event }: AppToolBridgeEvent,
): Promise<void> {
  if (
    this._activeBindingId &&
    bindingId !== this._activeBindingId &&
    !this.bindings.some((binding) => binding.id === bindingId)
  ) {
    return;
  }
  if (this.session) this._flushSessionTrace.get(this.session)?.();
  this.items = applyAgentEventToChatItems(this.items, event).map((item) =>
    item.agentBindingId ? item : { ...item, agentBindingId: bindingId },
  );
  const itemId =
    event.type === "permission.request"
      ? `approval-${event.request.id}`
      : event.type === "tool.start" || event.type === "tool.end"
        ? event.id
        : undefined;
  const item = itemId
    ? this.items.find(
        (candidate) =>
          candidate.id === itemId ||
          (candidate.type === "tool" && candidate.toolId === itemId),
      )
    : undefined;
  if (this.repository && this.location && item) {
    await this._appendDurableItems(this.location, [item], bindingId);
  } else if (!this.repository) {
    await this._persist(false, bindingId);
  }
}
