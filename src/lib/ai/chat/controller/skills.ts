// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat orchestration; see ../../NOTICE.md.
import type { SkillDiscoveryContext } from "../../skills/types.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
export async function refreshSkills(this: AiChatController): Promise<void> {
  this._refreshSkills = true;
  this._skills?.invalidate();
  if (this.busy) return;
  this.busy = true;
  try {
    await this._prepareSession(this._sessionRequest);
  } finally {
    this.busy = false;
    this._refreshSkills = false;
  }
}

export function _discoveryContext(
  this: AiChatController,
): SkillDiscoveryContext {
  return (
    this._skillContext?.() ?? {
      scopeDir: this.location?.scopeDir ?? "",
    }
  );
}

export function _ensureLocalAppToolSession(this: AiChatController): void {
  if (!this._appToolHost || !this._activeBindingId) return;
  if (this._appToolHost.getSession(this._activeBindingId)) return;
  this._appToolHost.createSession({
    conversationId: this.location?.conversationId ?? "local",
    agentBindingId: this._activeBindingId,
    scopeDir: this.location?.scopeDir ?? "",
    runtimeSupportsAppTools: true,
  });
}

export async function _effectiveSkillSnapshot(
  this: AiChatController,
): Promise<import("../../skills/types.ts").SkillSnapshot | undefined> {
  const scopeDir = this.location?.scopeDir ?? this._discoveryContext().scopeDir;
  if (this._activeBindingId) {
    return this._prepareSkillSnapshot(this._activeBindingId, scopeDir);
  }
  if (!this._skills) return undefined;
  return this._skills.snapshot(this._discoveryContext());
}

export async function _prepareSkillSnapshot(
  this: AiChatController,
  bindingId: string,
  scopeDir: string,
): Promise<import("../../skills/types.ts").SkillSnapshot | undefined> {
  if (!this._skills) return undefined;
  const existing = this._skillSnapshots.get(bindingId);
  await this._slashRouter?.catalog.refreshFileCommands(scopeDir);
  if (existing && !this._refreshSkills) {
    this._slashRouter?.catalog.rebuildSkillCommands(existing);
    return existing;
  }
  const snapshot = await this._skills.snapshot(
    this._skillContext?.() ?? { scopeDir },
  );
  this._skillSnapshots.set(bindingId, snapshot);
  this._slashRouter?.catalog.rebuildSkillCommands(snapshot);
  return snapshot;
}
