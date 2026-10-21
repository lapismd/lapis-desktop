import {
  agentMentionMatches,
  agentMentionToken,
} from "@lapismd/jj-conversations";
import type { AcpAgentId } from "../settings/acp-agents.ts";

/** Saved attribution, never a native execution or provider-session capability. */
export type SavedAgentRecipient = { id: string; token: string; label: string };
/** Host-owned person-reference text; mentions do not grant execution or delivery. */
export type ComposerPersonOption = {
  id: string;
  label: string;
  value: string;
  avatar?: string;
  avatarBackground?: string;
};
/** Application-owned setup catalog; routing stays separate from the saved tag. */
export type AgentRecipientOption = {
  providerProfileId?: string;
  approvalPolicy?: import("../core/approval-policy.ts").ApprovalPolicy;
  id: string;
  label: string;
  agent: AcpAgentId;
  model?: string;
  description?: string;
  instructions?: string;
  executionMode?: string;
  thinking?: import("../core/models.ts").AiThinkingLevel;
  avatar?: string;
  avatarBackground?: string;
};
export function validateRecipients(value: unknown): SavedAgentRecipient[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 4)
    throw new Error("Message recipients must contain at most four agents");
  const seen = new Set<string>();
  return value.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry))
      throw new Error("Message recipient is invalid");
    const { id, token, label } = entry as Record<string, unknown>;
    const match = typeof token === "string" ? agentMentionMatches(token) : [];
    if (
      Object.keys(entry).some(
        (key) => !["id", "token", "label"].includes(key),
      ) ||
      typeof id !== "string" ||
      seen.has(id) ||
      match.length !== 1 ||
      match[0]!.value !== token ||
      match[0]!.agentId !== id ||
      typeof label !== "string" ||
      !label.trim() ||
      [...label].length > 80 ||
      /[\x00-\x1f\x7f\u2028\u2029]/u.test(label)
    )
      throw new Error("Message recipient identity or label is invalid");
    seen.add(id);
    return { id, token: token as string, label };
  });
}
export function recipientFromOption(
  option: AgentRecipientOption,
): SavedAgentRecipient {
  return validateRecipients([
    { id: option.id, label: option.label, token: agentMentionToken(option.id) },
  ])[0]!;
}
