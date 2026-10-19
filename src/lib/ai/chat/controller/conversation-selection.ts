// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat orchestration; see ../../NOTICE.md.
import type { CreateConversationInput } from "../../conversations/conversation-repository.ts";
import { relocateConversationLocation } from "../../conversations/conversation-locator.ts";
import { ConversationUnavailableError } from "../../conversations/types.ts";
import { normalizeConversationScope } from "../../conversations/paths.ts";
import { conversationsInScopeTree } from "../../conversations/scope-tree.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
export async function newConversation(
  this: AiChatController,
  input?: CreateConversationInput,
): Promise<void> {
  this.queuedMessages.pause();
  this.queuedMessages.entries = [];
  await this._closeAppToolBinding();
  await this.session?.close().catch(() => undefined);
  this.session = null;
  this.busy = false;
  this.error = null;
  this.usage = null;
  this.items = [];
  this._activeBinding = undefined;
  this._activeBindingId = undefined;
  this.bindings = [];
  this.location = null;
  this.conversationStatus = null;
  this.importedSnapshot = null;
  this.conversationPinned = false;
  this.pickerEntries = [];
  this._approvalGrants = [];
  if (this.repository && input) {
    const created = await this.repository.create(input);
    this.location = created.location;
    this.conversationStatus = created.metadata.status;
    this.conversationPinned = Boolean(created.metadata.pinned);
    this.directoryContext = created.location.scopeDir;
    this._followedScope = created.location.scopeDir;
  }
  this._onLocationChange?.(this.location);
}

export async function archiveCurrent(
  this: AiChatController,
  archived = true,
): Promise<void> {
  if (!this.repository || !this.location) return;
  const snapshot = await this.repository.archive(this.location, archived);
  this.conversationStatus = snapshot.metadata.status;
}

export function relocateScope(
  this: AiChatController,
  oldPath: string,
  newPath: string,
): void {
  this.queuedMessages.pause();
  if (this.location) {
    const relocated = relocateConversationLocation(
      this.location,
      oldPath,
      newPath,
    );
    if (relocated) {
      if (relocated.scopeDir !== this.location.scopeDir) {
        void this._closeAppToolBinding();
      }
      this.location = relocated;
      this._onLocationChange?.(relocated);
    }
  }
  for (const context of this._sessionContexts.values()) {
    if (!context.location) continue;
    const next = relocateConversationLocation(
      context.location,
      oldPath,
      newPath,
    );
    if (next) context.location = next;
  }
}

export async function deleteCurrent(this: AiChatController): Promise<void> {
  this.queuedMessages.pause();
  this.queuedMessages.entries = [];
  if (!this.repository || !this.location) return;
  const location = this.location;
  await this._closeAppToolBinding();
  await this.session?.close().catch(() => undefined);
  await this.repository.delete(location);
  this.session = null;
  this.busy = false;
  this.error = null;
  this.usage = null;
  this.items = [];
  this._activeBinding = undefined;
  this._activeBindingId = undefined;
  this.bindings = [];
  this.location = null;
  this.conversationStatus = null;
  this.importedSnapshot = null;
  this.conversationPinned = false;
  this.pickerEntries = [];
  this._approvalGrants = [];
  this._onLocationChange?.(null);
}

export async function followDirectoryScope(
  this: AiChatController,
  scopeDir: string,
  options: { force?: boolean } = {},
): Promise<void> {
  if (this._disposed || !this.repository) return;
  const scope = normalizeConversationScope(scopeDir);
  this._desiredFollowScope = scope;
  if (!options.force && (this.busy || this.conversationPinned)) return;
  if (!options.force && this._followedScope === scope) return;
  const generation = ++this._followGeneration;
  this.directoryContext = scope;
  this._followedScope = scope;
  const matches = conversationsInScopeTree(
    await this.repository.listAll(),
    scope,
  );
  if (this._disposed || generation !== this._followGeneration) return;
  if (matches.length === 0) {
    this.pickerEntries = [];
    if (this.location) await this._clearOpenConversation();
    return;
  }
  if (matches.length === 1) {
    this.pickerEntries = [];
    const next = matches[0]!.location;
    if (
      this.location?.scopeDir === next.scopeDir &&
      this.location.conversationId === next.conversationId
    ) {
      return;
    }
    await this.openConversation(next);
    return;
  }
  this.pickerEntries = matches;
  if (this.location) await this._clearOpenConversation();
}

export async function setPinned(
  this: AiChatController,
  pinned: boolean,
): Promise<void> {
  if (!this.repository || !this.location) return;
  const snapshot = await this.repository.writePinned(this.location, pinned);
  this.conversationPinned = Boolean(snapshot.metadata.pinned);
  if (!this.conversationPinned) {
    await this.followDirectoryScope(
      this._desiredFollowScope ?? this.directoryContext,
      { force: true },
    );
  }
}

export async function _clearOpenConversation(
  this: AiChatController,
): Promise<void> {
  this.queuedMessages.pause();
  this.queuedMessages.entries = [];
  this._recoveredTurn = undefined;
  await this._closeAppToolBinding();
  await this.session?.close().catch(() => undefined);
  this.session = null;
  this.busy = false;
  this.error = null;
  this.usage = null;
  this.items = [];
  this._activeBinding = undefined;
  this._activeBindingId = undefined;
  this.bindings = [];
  this.location = null;
  this.conversationStatus = null;
  this.importedSnapshot = null;
  this.conversationPinned = false;
  this._approvalGrants = [];
  this._onLocationChange?.(null);
}

export async function _ensureConversation(
  this: AiChatController,
): Promise<void> {
  if (!this.repository) return;
  if (this.location) {
    try {
      const snapshot = await this.repository.read(this.location);
      this._loadApprovalGrants(snapshot.metadata);
      return;
    } catch (error) {
      if (!(error instanceof ConversationUnavailableError)) throw error;
      this.location = null;
      this.conversationStatus = null;
      this.importedSnapshot = null;
      this._approvalGrants = [];
      this._onLocationChange?.(null);
    }
  }
  const followedScope = this._followedScope ?? this.directoryContext;
  const input =
    this._followedScope !== undefined || this.directoryContext
      ? (this._createConversation?.(followedScope) ?? {
          scopeDir: followedScope,
        })
      : (this._createConversation?.() ?? { scopeDir: "" });
  const created = await this.repository.create(input);
  this.location = created.location;
  this.conversationStatus = created.metadata.status;
  this.conversationPinned = Boolean(created.metadata.pinned);
  this.directoryContext = created.location.scopeDir;
  this._followedScope = created.location.scopeDir;
  this.pickerEntries = [];
  this._approvalGrants = [];
  this._onLocationChange?.(this.location);
}
