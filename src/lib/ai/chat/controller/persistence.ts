// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat orchestration; see ../../NOTICE.md.
import type { AgentUsage } from "../../core/models.ts";
import type { StoredAgentSession } from "../../sessions/session-store.ts";
import { projectChatItemsToTranscript } from "../../conversations/chat-to-transcript.ts";
import {
  CONVERSATION_SCHEMA_VERSION,
  type ConversationLocation,
} from "../../conversations/types.ts";
import { snapshotStoredChatSession } from "../chat-session.ts";
import { type AiChatItem } from "../chat-items.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
import { namespaceChatItems } from "./conversation-loading.ts";
export async function _appendDurableItems(
  this: AiChatController,
  location: ConversationLocation,
  items: AiChatItem[],
  agentBindingId = this._activeBindingId,
  busy = false,
  interrupted = false,
  namespace?: string,
): Promise<void> {
  if (!this.repository) return;
  const durableItems = namespace ? namespaceChatItems(items, namespace) : items;
  const entries = projectChatItemsToTranscript(durableItems, {
    agentBindingId,
  }).filter(
    (entry) =>
      !(busy && entry.type === "message" && entry.role === "assistant"),
  );
  if (interrupted) {
    entries.push({
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      id: `cancelled-${crypto.randomUUID()}`,
      type: "cancelled",
      text: "Agent turn interrupted",
      createdAt: new Date().toISOString(),
      agentBindingId,
    });
    for (const item of durableItems) {
      if (
        (item.type === "approval" || item.type === "question") &&
        item.status === "cancelled"
      ) {
        entries.push({
          schemaVersion: CONVERSATION_SCHEMA_VERSION,
          id: `${item.id}:cancelled`,
          type: "cancelled",
          createdAt: new Date().toISOString(),
          requestId: item.request.id,
          interactionType: item.type,
          agentBindingId,
        });
      }
    }
  }
  if (entries.length > 0) {
    await this.repository.appendTranscript(location, entries);
  }
}

export async function _appendUsage(
  this: AiChatController,
  location: ConversationLocation,
  agentBindingId: string,
  usage: AgentUsage,
): Promise<void> {
  if (!this.repository) return;
  await this.repository.appendAgentRecords(location, [
    {
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      id: `usage-${crypto.randomUUID()}`,
      type: "usage.updated",
      createdAt: new Date().toISOString(),
      agentBindingId,
      usage: { ...usage },
    },
  ]);
}

export async function _persist(
  this: AiChatController,
  interrupted = false,
  agentBindingId = this._activeBindingId,
): Promise<void> {
  if (this.repository) {
    if (!this.location) return;
    const location = { ...this.location };
    const items = [...this.items];
    const busy = this.busy;
    this._persistQueue = this._persistQueue.then(async () => {
      if (!this.repository) return;
      await this._appendDurableItems(
        location,
        items,
        agentBindingId,
        busy,
        interrupted,
      );
      if (!busy && this.usage && this._usageDirty && agentBindingId) {
        await this._appendUsage(location, agentBindingId, this.usage);
        this._usageDirty = false;
      }
    });
    await this._persistQueue;
    return;
  }
  if (!this.store) return;
  this._persistQueue = this._persistQueue.then(async () => {
    const snapshot: StoredAgentSession = snapshotStoredChatSession({
      id: this.sessionId,
      runtime: this.runtime.id,
      runtimeSessionId: this.session?.id ?? this.sessionId,
      workspace: this.workspace,
      agent: this._sessionRequest.agent,
      model: this._sessionRequest.model,
      thinking: this._sessionRequest.thinking,
      usage: this.usage ?? undefined,
      items: this.items,
      createdAt: this._createdAt,
      interrupted,
    });
    this._createdAt = snapshot.createdAt;
    await this.store?.save(snapshot);
  });
  await this._persistQueue;
}
