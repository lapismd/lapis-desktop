// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat orchestration; see ../../NOTICE.md.
import type { AgentEvent } from "../../core/events.ts";
import {
  type AiChatInventory,
  type AiChatInventoryItem,
  type AiChatItem,
} from "../chat-items.ts";
import { applyAgentEventToChatItems } from "../chat-trace.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
export async function _withCommandProgress(
  this: AiChatController,
  work: (turnId: number) => Promise<void>,
): Promise<void> {
  const turnId = ++this._turnId;
  this.busy = true;
  this.commandWorking = true;
  try {
    await work(turnId);
  } finally {
    this.commandWorking = false;
    if (this._turnId === turnId) this.busy = false;
  }
}

export function _appendLocalNotice(this: AiChatController, text: string): void {
  this.items = [
    ...this.items,
    {
      id: `notice-${crypto.randomUUID()}`,
      type: "status",
      text,
      layout: "report",
      createdAt: new Date().toISOString(),
    },
  ];
}

export function _appendInventoryNotice(
  this: AiChatController,
  kind: AiChatInventory["kind"],
  items: AiChatInventoryItem[],
  emptyText: string,
): void {
  this.items = [
    ...this.items,
    {
      id: `notice-${crypto.randomUUID()}`,
      type: "status",
      text: items.map((item) => item.name).join(", ") || emptyText,
      layout: "inventory",
      inventory: { kind, items },
      createdAt: new Date().toISOString(),
    },
  ];
}

export async function _recordCommandItem(
  this: AiChatController,
  command: string,
  source: "app" | "extension" | "skill" | "native-agent",
  args?: string,
): Promise<void> {
  const item: AiChatItem = {
    id: `command-${crypto.randomUUID()}`,
    type: "command",
    command,
    origin: source,
    arguments: args,
    status: "completed",
    text: `/${command}${args ? ` ${args}` : ""}`,
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
  }
}

export async function _persistCommandNotice(
  this: AiChatController,
): Promise<void> {
  const item = this.items.at(-1);
  if (this.repository && this.location && item) {
    await this._appendDurableItems(
      this.location,
      [item],
      this._activeBindingId,
    );
  }
}

export async function _applySlashToolEvent(
  this: AiChatController,
  event: Extract<AgentEvent, { type: "tool.start" | "tool.end" }>,
): Promise<void> {
  const bindingId = this._activeBindingId;
  this.items = applyAgentEventToChatItems(this.items, event).map((item) =>
    item.agentBindingId || !bindingId
      ? item
      : { ...item, agentBindingId: bindingId },
  );
  const item = this.items.find(
    (candidate) =>
      candidate.id === event.id ||
      (candidate.type === "tool" && candidate.toolId === event.id),
  );
  if (this.repository && this.location && item) {
    await this._appendDurableItems(this.location, [item], bindingId);
  } else if (!this.repository) {
    await this._persist(false, bindingId);
  }
}

export async function syncComposerCommands(
  this: AiChatController,
): Promise<void> {
  await this._syncSlashCatalog();
}

export async function _syncSlashCatalog(this: AiChatController): Promise<void> {
  if (!this._slashRouter || !this._skills) return;
  const context = this._discoveryContext();
  await this._slashRouter.catalog.refreshFileCommands(context.scopeDir);
  const snapshot = await this._effectiveSkillSnapshot();
  if (snapshot) this._slashRouter.catalog.rebuildSkillCommands(snapshot);
}
