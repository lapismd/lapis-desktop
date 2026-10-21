// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat orchestration; see ../../NOTICE.md.
import { observedCommand } from "./observed-command.ts";
import type { AgentRequest } from "../../core/runtime.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
export async function _submitWithActivation(
  this: AiChatController,
  activation: {
    skillId: string;
    skillName: string;
    version: string;
    source: "user" | "model" | "app";
    arguments?: string;
    instructions: string;
  },
  request: Omit<AgentRequest, "prompt">,
): Promise<boolean> {
  const turnId = this._turnId;
  this.busy = true;
  const itemId = `skill-${crypto.randomUUID()}`;
  try {
    if (this.repository) await this._ensureConversation();
    await observedCommand(this, request, itemId, turnId, async () => {
      await this._prepareSession(
        {
          ...request,
          skillActivations: [activation],
        },
        turnId,
      );
      if (this._isAbandoned(turnId) || !this.session) return;
      this.items = [
        ...this.items,
        {
          id: itemId,
          type: "skill-activation",
          skillId: activation.skillId,
          skillName: activation.skillName,
          version: activation.version,
          origin: activation.source,
          arguments: activation.arguments,
          text: `Skill ${activation.skillName} (${activation.version})`,
          createdAt: new Date().toISOString(),
          agentBindingId: this._activeBindingId,
        },
      ];
      if (this.repository && this.location) {
        await this._appendDurableItems(
          this.location,
          [this.items.at(-1)!],
          this._activeBindingId,
        );
      }
      await this.session.send(
        activation.arguments?.trim() || activation.skillName,
      );
    });
    return !this._isAbandoned(turnId) && !this.error;
  } finally {
    if (this._turnId === turnId) this.busy = false;
  }
}
