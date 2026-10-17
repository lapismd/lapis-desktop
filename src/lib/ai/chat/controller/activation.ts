// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat orchestration; see ../../NOTICE.md.
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
): Promise<void> {
  this.busy = true;
  try {
    await this._prepareSession({
      ...request,
      skillActivations: [activation],
    });
    this.items = [
      ...this.items,
      {
        id: `skill-${crypto.randomUUID()}`,
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
    await this.session?.send(
      activation.arguments?.trim() || activation.skillName,
    );
  } finally {
    this.busy = false;
  }
}
