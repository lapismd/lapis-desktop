// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat orchestration; see ../../NOTICE.md.
import { interruptPendingInteractions } from "../../sessions/session-store.ts";
import {
  effectiveAgentBinding,
  reduceAgentBindings,
} from "../../conversations/binding-state.ts";
import { projectTranscriptToChatItems } from "../../conversations/transcript-to-chat.ts";
import { type ConversationLocation } from "../../conversations/types.ts";
import {
  applyStoredSessionResumePolicy,
  chatSessionId,
  loadStoredChatSession,
} from "../chat-session.ts";
import { type AiChatItem } from "../chat-items.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
import { restoreTurn } from "./turn-checkpoint.ts";
export async function restore(this: AiChatController): Promise<void> {
  const turnId = this._turnId;
  if (this._isAbandoned(turnId)) return;
  if (this.repository && this.location) {
    try {
      await this._restoreConversation();
    } catch (error) {
      this._releaseUnreadableLocation(error);
    }
    return;
  }
  let stored = await loadStoredChatSession(this.store, this.sessionId);
  if (this._isAbandoned(turnId)) return;
  if (!stored) {
    const legacy = await loadStoredChatSession(
      this.store,
      chatSessionId(this.workspace),
    );
    if (this._isAbandoned(turnId)) return;
    if (
      legacy &&
      legacy.runtime === this.runtime.id &&
      (legacy.agent === this.request.agent ||
        (!legacy.agent && this.request.agent === "codex"))
    ) {
      stored = legacy;
    }
  }
  if (!stored) return;
  this._createdAt = stored.createdAt;
  this._sessionRequest = {
    ...this.request,
    agent: stored.agent ?? this.request.agent,
    model: stored.model ?? this.request.model,
    thinking: stored.thinking ?? this.request.thinking,
    workspace: stored.workspace ?? this.workspace,
  };
  this.items = [...stored.items];
  this.usage = stored.usage ? { ...stored.usage } : null;
  let resumed = false;
  if (this.runtime.capabilities().resume && this.runtime.resume) {
    try {
      const session = await this.runtime.resume(
        stored.runtimeSessionId,
        this._sessionRequest,
      );
      if (this._isAbandoned(turnId)) {
        await session.close();
        return;
      }
      this.session = session;
      resumed = true;
    } catch {
      this.session = null;
    }
  }
  const restored = applyStoredSessionResumePolicy({
    stored,
    runtime: this.runtime,
    resumed,
  });
  this.items = restored.items;
  if (resumed && this.session) void this._consume(this.session);
  await this._persist(restored.interrupted);
}

export async function openConversation(
  this: AiChatController,
  location: ConversationLocation,
): Promise<void> {
  if (this._disposed) return;
  if (!this.repository) return;
  await this._closeAppToolBinding();
  await this.session?.close().catch(() => undefined);
  if (this._disposed) return;
  this.session = null;
  this.busy = false;
  this.error = null;
  this.conversationStatus = null;
  this.location = { ...location };
  this.directoryContext = location.scopeDir;
  this._followedScope = location.scopeDir;
  this._desiredFollowScope = location.scopeDir;
  this.pickerEntries = [];
  this._onLocationChange?.(this.location);
  try {
    await this._restoreConversation();
  } catch (error) {
    this._releaseUnreadableLocation(error);
  }
}

export async function _restoreConversation(
  this: AiChatController,
): Promise<void> {
  const turnId = this._turnId;
  if (this._isAbandoned(turnId)) return;
  if (!this.repository || !this.location) return;
  const snapshot = await this.repository.read(this.location);
  if (this._isAbandoned(turnId)) return;
  this.conversationStatus = snapshot.metadata.status;
  this.conversationPinned = Boolean(snapshot.metadata.pinned);
  this.directoryContext = snapshot.location.scopeDir;
  this._loadApprovalGrants(snapshot.metadata);
  this.items = projectTranscriptToChatItems(snapshot.transcript);
  const activeBinding = effectiveAgentBinding(
    snapshot.agents,
    snapshot.metadata.activeAgentBindingId,
  );
  this._activeBinding = activeBinding;
  this._activeBindingId = activeBinding?.id;
  if (activeBinding) {
    await this._prepareSkillSnapshot(
      activeBinding.id,
      snapshot.location.scopeDir,
    );
    if (this._isAbandoned(turnId)) return;
  }
  this.bindings = reduceAgentBindings(snapshot.agents);
  const latestUsage = [...snapshot.agents]
    .reverse()
    .find(
      (record) =>
        record.type === "usage.updated" &&
        (!activeBinding || record.agentBindingId === activeBinding.id),
    );
  this.usage =
    latestUsage?.type === "usage.updated" ? { ...latestUsage.usage } : null;
  const unconfirmed = await restoreTurn(this);
  if (this._isAbandoned(turnId)) return;
  if (unconfirmed) {
    this.items = interruptPendingInteractions(this.items);
    return;
  }
  if (!activeBinding || activeBinding.runtime !== this.runtime.id) {
    await this._interruptUnresumableInteractions();
    return;
  }
  this._sessionRequest = {
    ...this.request,
    agent: activeBinding.agent,
    recipients: activeBinding.participant
      ? [{ ...activeBinding.participant }]
      : undefined,
    model: activeBinding.model,
    thinking: activeBinding.thinking,
    workspace: this.workspace,
  };
  if (
    !activeBinding.nativeSessionId ||
    !activeBinding.context ||
    !this.runtime.capabilities().resume ||
    !this.runtime.resume
  ) {
    await this._interruptUnresumableInteractions();
    return;
  }
  try {
    const appToolSession = await this._prepareAppToolSession(
      activeBinding.id,
      this.runtime,
      snapshot.location,
      snapshot.metadata.launchContext?.notePath,
    );
    if (this._isAbandoned(turnId)) {
      await this._closeAppToolBinding(activeBinding.id);
      return;
    }
    const session = await this.runtime.resume(activeBinding.nativeSessionId, {
      ...this._sessionRequest,
      appToolSession,
    });
    if (this._isAbandoned(turnId)) {
      await session.close();
      await this._closeAppToolBinding(activeBinding.id);
      return;
    }
    this.session = session;
    void this._consume(this.session, activeBinding.id);
  } catch (error) {
    await this._closeAppToolBinding(activeBinding.id);
    if (this._isAbandoned(turnId)) return;
    this.session = null;
    this.error = `Could not resume the previous agent session. Your local history is still available. ${
      error instanceof Error ? error.message : String(error)
    }`;
    await this._interruptUnresumableInteractions();
  }
}

export async function _interruptUnresumableInteractions(
  this: AiChatController,
): Promise<void> {
  const hasPending = this.items.some(
    (item) =>
      (item.type === "approval" || item.type === "question") &&
      item.status === "pending",
  );
  if (!hasPending) return;
  this.items = interruptPendingInteractions(this.items);
  await this._persist(true, this._activeBindingId);
}

export function _releaseUnreadableLocation(
  this: AiChatController,
  error: unknown,
): void {
  if (this._disposed) return;
  this.error = error instanceof Error ? error.message : String(error);
  this._approvalGrants = [];
  if (!this.location) return;
  this.location = null;
  this.conversationStatus = null;
  this.conversationPinned = false;
  this._onLocationChange?.(null);
}

export function namespaceChatItems(
  items: AiChatItem[],
  namespace: string,
): AiChatItem[] {
  return items.map((item) =>
    (item.type === "message" && item.role === "user") ||
    item.id.startsWith("turn-unknown:") ||
    item.id.startsWith(`${namespace}:`)
      ? item
      : { ...item, id: `${namespace}:${item.id}` },
  );
}
