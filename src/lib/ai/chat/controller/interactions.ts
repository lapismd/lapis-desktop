import { cancelDispatch } from "./dispatch.ts";
import { requireApprovalOption } from "../../core/approvals.ts";
// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat orchestration; see ../../NOTICE.md.
import type { AgentRequest, AgentSession } from "../../core/runtime.ts";
import type { UserInputAnswers } from "../../core/approvals.ts";
import { interruptPendingInteractions } from "../../sessions/session-store.ts";
import { createChatItemId, type AiChatItem } from "../chat-items.ts";
import { markApprovalResponse, markQuestionResponse } from "../chat-trace.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
const CANCELLED_NOTICE = "Agent turn cancelled";

export async function respondToApproval(
  this: AiChatController,
  requestId: string,
  optionId: string,
  itemId?: string,
): Promise<void> {
  const pending = this.items.find(
    (candidate) =>
      candidate.type === "approval" &&
      candidate.request.id === requestId &&
      candidate.status === "pending" &&
      candidate.agentBindingId === this._activeBindingId &&
      (!itemId || candidate.id === itemId),
  );
  if (pending?.type !== "approval" || pending.status !== "pending")
    throw new Error(`Unknown application approval: ${requestId}`);
  requireApprovalOption(pending.request, optionId);
  const session = this.session;
  const location = this.location;
  const turnId = this._turnId;
  if (pending.request.origin === "app-tool") {
    if (!this._appToolBridge?.respondToApproval(requestId, optionId))
      throw new Error(`Unknown application-tool approval: ${requestId}`);
  } else {
    if (!session)
      throw new Error("The active runtime cannot answer approvals.");
    await session.respondToApproval(requestId, optionId);
    if (
      this.session !== session ||
      this._turnId !== turnId ||
      this.location?.conversationId !== location?.conversationId ||
      this.location?.scopeDir !== location?.scopeDir
    )
      return;
  }
  const current = this.items.find((candidate) => candidate.id === pending.id);
  if (
    current?.type !== "approval" ||
    current.request !== pending.request ||
    current.status !== "pending"
  )
    return;
  this.items = this.items.map((item) =>
    item === current
      ? markApprovalResponse([item], requestId, optionId)[0]!
      : item,
  );
  await this._rememberPersistentDecision(pending.request, optionId);
  const item = this.items.find((candidate) => candidate.id === pending.id);
  if (this.repository && this.location && item)
    await this._appendDurableItems(
      this.location,
      [item],
      this._activeBindingId,
    );
  else await this._persist();
}

export async function respondToQuestion(
  this: AiChatController,
  requestId: string,
  answers: UserInputAnswers,
  itemId?: string,
): Promise<void> {
  const session = this.session;
  if (!session?.respondToQuestion)
    throw new Error("The active runtime cannot answer agent questions.");
  const pending = this.items.find(
    (candidate) =>
      candidate.type === "question" &&
      candidate.request.id === requestId &&
      candidate.status === "pending" &&
      candidate.agentBindingId === this._activeBindingId &&
      (!itemId || candidate.id === itemId),
  );
  if (pending?.type !== "question" || pending.status !== "pending")
    throw new Error(`Unknown agent question: ${requestId}`);
  const location = this.location;
  const turnId = this._turnId;
  await session.respondToQuestion(requestId, answers);
  if (
    this.session !== session ||
    this._turnId !== turnId ||
    this.location?.conversationId !== location?.conversationId ||
    this.location?.scopeDir !== location?.scopeDir
  )
    return;
  const current = this.items.find((candidate) => candidate.id === pending.id);
  if (
    current?.type !== "question" ||
    current.request !== pending.request ||
    current.status !== "pending"
  )
    return;
  this.items = this.items.map((item) =>
    item === current ? markQuestionResponse([item], requestId)[0]! : item,
  );
  const item = this.items.find((candidate) => candidate.id === pending.id);
  if (this.repository && this.location && item)
    await this._appendDurableItems(
      this.location,
      [item],
      this._activeBindingId,
    );
  else await this._persist();
}

export async function cancel(this: AiChatController): Promise<void> {
  if (this.session) this._flushSessionTrace.get(this.session)?.();
  this._turnId += 1;
  const dispatchCancellation = cancelDispatch(this);
  void dispatchCancellation.catch(() => undefined);
  this._activeRecallAbort?.abort();
  this._activeRecallAbort = undefined;
  const session = this.session;
  if (session) this._cancelledSessions.add(session);
  this.busy = false;
  this.commandWorking = false;
  this.items = interruptPendingInteractions(this.items);
  void this._confirmCancelledNotice(session);
  await this._persist(true);
  await dispatchCancellation;
}

export async function _confirmCancelledNotice(
  this: AiChatController,
  session: AgentSession | null,
): Promise<void> {
  if (session) {
    try {
      await session.cancel?.();
    } catch {
      return;
    }
    if (!this._cancelledSessions.has(session)) return;
    if (this.session !== session && this.session) return;
  }
  if (
    this.items.some(
      (item) => item.type === "status" && item.text === CANCELLED_NOTICE,
    )
  ) {
    return;
  }
  const item: AiChatItem = {
    id: createChatItemId("status", this.items.length + 1),
    type: "status",
    text: CANCELLED_NOTICE,
    createdAt: new Date().toISOString(),
    agentBindingId: this._activeBindingId,
  };
  this.items = [...this.items, item];
  if (this.repository && this.location) {
    await this._appendDurableItems(
      this.location,
      [item],
      this._activeBindingId,
    );
    return;
  }
  await this._persist(false, this._activeBindingId);
}

export async function cancelAndSwitch(
  this: AiChatController,
  request: Omit<AgentRequest, "prompt">,
): Promise<void> {
  if (this.busy) await this.cancel();
  this.error = null;
  await this._prepareSession({ ...this.request, ...request });
}

export async function close(this: AiChatController): Promise<void> {
  for (const flush of this._flushSessionTrace.values()) flush();
  this._disposed = true;
  this._turnId += 1;
  const dispatchCancellation = cancelDispatch(this);
  void dispatchCancellation.catch(() => undefined);
  this._unsubscribeAppToolEvents?.();
  this._unsubscribeAppToolEvents = undefined;
  this._activeRecallAbort?.abort();
  this._activeRecallAbort = undefined;
  const interrupted = this.busy;
  const sessions = new Set(this._sessionContexts.keys());
  if (this.session) sessions.add(this.session);
  this.busy = false;
  this.commandWorking = false;
  if (interrupted) this.items = interruptPendingInteractions(this.items);
  const results = await Promise.allSettled([
    dispatchCancellation,
    this._persist(interrupted),
    this._closeAppToolBinding(),
    ...[...sessions].map(async (session) => {
      this._cancelledSessions.add(session);
      if (interrupted) await session.cancel?.().catch(() => undefined);
      await session.close();
    }),
  ]);
  this.session = null;
  this.busy = false;
  await this._backgroundWork.settle();
  await this._terminalCheckpoint;
  for (const binding of this.bindings) {
    this._slashRouter?.catalog.clearNativeCommands(binding.id);
  }
  if (this._activeBindingId) {
    this._slashRouter?.catalog.clearNativeCommands(this._activeBindingId);
  }
  this._skillSnapshots.clear();
  const failures = results.flatMap((result) =>
    result.status === "rejected" ? [result.reason] : [],
  );
  if (failures.length)
    throw new AggregateError(failures, "AI controller cleanup failed");
}
