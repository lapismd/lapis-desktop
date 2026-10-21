import {
  validateAgentProfile,
  assertExecutionMode,
} from "../core/agent-profile.ts";
import { ACP_AGENT_IDS } from "./acp-agents.ts";
import {
  validateAgentAvatar,
  validateAgentAvatarBackground,
} from "./agent-avatar.ts";
import {
  recipientFromOption,
  type AgentRecipientOption,
} from "../conversations/recipients.ts";
/** Logical participant names select an existing target, never an executable. */
export function validateAgentParticipants(
  value: unknown,
): AgentRecipientOption[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > 16)
    throw new Error("Configure at most sixteen agent participants");
  const ids = new Set<string>();
  return value.map((entry) => {
    if (
      !entry ||
      typeof entry !== "object" ||
      Array.isArray(entry) ||
      Object.keys(entry).some(
        (key) =>
          ![
            "id",
            "label",
            "agent",
            "description",
            "instructions",
            "executionMode",
            "model",
            "thinking",
            "avatar",
            "avatarBackground",
          ].includes(key),
      )
    )
      throw new Error("Invalid agent participant");
    const { id, label, agent, model, thinking, avatar, avatarBackground } =
      entry as AgentRecipientOption;
    const { description, instructions, executionMode } =
      entry as AgentRecipientOption;
    validateAgentProfile({ description, instructions });
    assertExecutionMode(executionMode);
    const image = validateAgentAvatar(avatar),
      background = validateAgentAvatarBackground(avatarBackground);
    if (!ACP_AGENT_IDS.includes(agent) || ids.has(id))
      throw new Error("Agent participant target or identity is invalid");
    recipientFromOption({ id, label, agent });
    if (
      model !== undefined &&
      (typeof model !== "string" ||
        !model.trim() ||
        model.length > 256 ||
        /[\x00-\x1f\x7f]/u.test(model))
    )
      throw new Error("Invalid agent model");
    if (
      thinking !== undefined &&
      !["default", "off", "low", "medium", "high"].includes(thinking)
    )
      throw new Error("Invalid agent effort");
    ids.add(id);
    return {
      id,
      label,
      agent,
      ...(model ? { model: model.trim() } : {}),
      ...(description ? { description } : {}),
      ...(instructions ? { instructions } : {}),
      ...(executionMode ? { executionMode } : {}),
      ...(thinking ? { thinking } : {}),
      ...(image ? { avatar: image } : {}),
      ...(background ? { avatarBackground: background } : {}),
    };
  });
}
