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
import type { AiChatController } from "../chat-controller.svelte.ts";
import { waitForNextTask } from "./turn.ts";
import { StreamingChatTrace } from "./streaming-trace.ts";
import { eventIdentity } from "./event-identity.ts";
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
    const wasGroup = Boolean(context.delivery);
    const completed = context.turn?.outcome === "completed";
    await finishTurn(this, session);
    context.pendingBinding = undefined;
    context.pendingSwitch = undefined;
    context.pendingActivationBindingId = undefined;
    context.pendingConfiguration = undefined;
    context.handoff = undefined;
    context.pendingItems = [];
    traceItems = [];
    latestUsage = null;
    if (!wasGroup) this.queuedMessages.afterTerminal(completed);
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
      if (context.turn && event.type === "completed") {
        context.turn.known = true;
        context.turn.outcome = "completed";
      }
      if (context.turn && event.type === "error") {
        context.turn.known = knownTurnError(event.error);
        context.turn.outcome = context.turn.known ? "rejected" : "unknown";
      }
      const receivedAt = new Date().toISOString();
      const identify = eventIdentity(
        this.repository ? agentBindingId : undefined,
      );
      traceItems = applyAgentEventToChatItems(
        traceItems,
        event,
        () => receivedAt,
        identify,
      );
      const activeSession = this.session === session;
      const cancelled = this._cancelledSessions.has(session);
      if (activeSession && !cancelled) {
        live.receive(event, receivedAt, identify);
      }
      if (event.type === "completed" || event.type === "error") {
        if (event.type === "error" && activeSession) {
          this.error = event.error.message;
        }
      }
      if (
        activeSession &&
        !context.delivery &&
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
    if (context.turn) {
      context.turn.known = knownTurnError(error);
      context.turn.outcome = context.turn.known ? "rejected" : "unknown";
    }
    const normalized =
      error instanceof Error ? error : new Error(String(error));
    const errorEvent = {
      type: "error",
      error: normalized,
    } as const;
    const identify = eventIdentity(
      this.repository ? agentBindingId : undefined,
    );
    traceItems = applyAgentEventToChatItems(
      traceItems,
      errorEvent,
      undefined,
      identify,
    );
    if (this.session === session) {
      this.error = normalized.message;
      this.items = applyAgentEventToChatItems(
        this.items,
        errorEvent,
        undefined,
        identify,
      );
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
