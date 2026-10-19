import { ACP_AGENT_IDS } from "./acp-agents.ts";
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
      Object.keys(entry).some((key) => !["id", "label", "agent"].includes(key))
    )
      throw new Error("Invalid agent participant");
    const { id, label, agent } = entry as AgentRecipientOption;
    if (!ACP_AGENT_IDS.includes(agent) || ids.has(id))
      throw new Error("Agent participant target or identity is invalid");
    recipientFromOption({ id, label, agent });
    ids.add(id);
    return { id, label, agent };
  });
}
