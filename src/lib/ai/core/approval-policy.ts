// SPDX-License-Identifier: Apache-2.0
// Adapted from ai-controller/src/domain/approval-policy.ts; host scope stays owned here.
import type { ApprovalRequest } from "./approvals.ts";
import type { AgentRequest } from "./runtime.ts";
import type { AgentRecipientOption } from "../conversations/recipients.ts";

export type ApprovalPolicy = "ask" | "allow-all";
export const APPROVAL_POLICIES = [
  {
    value: "ask",
    label: "Ask for approval",
    description: "Review actions that need approval.",
  },
  {
    value: "allow-all",
    label: "Approve for me",
    description: "Approve offered one-time permissions.",
  },
] as const;
export function isApprovalPolicy(value: unknown): value is ApprovalPolicy {
  return value === "ask" || value === "allow-all";
}
export function normalizeApprovalPolicy(value: unknown): ApprovalPolicy {
  return value === "allow-all" ? "allow-all" : "ask";
}
/** Saved attribution cannot invent a profile or borrow a different client's policy. */
export function effectiveApprovalPolicy(
  settings: {
    approvalPolicy?: ApprovalPolicy;
    agentParticipants?: readonly AgentRecipientOption[];
  },
  request: Pick<AgentRequest, "agent" | "recipients" | "restricted">,
  profiles = settings.agentParticipants ?? [],
): ApprovalPolicy {
  if (request.restricted) return "ask";
  const id = request.recipients?.[0]?.id ?? request.agent;
  const profile = profiles.find(
    (p) => p.id === id && p.agent === request.agent,
  );
  if (request.recipients?.length && !profile) return "ask";
  return normalizeApprovalPolicy(
    profile?.approvalPolicy ?? settings.approvalPolicy,
  );
}
/** Never infer permission from a label/ID or silently create a lasting grant. */
export function automaticApprovalOption(
  policy: ApprovalPolicy,
  request: ApprovalRequest,
): string | undefined {
  if (
    policy !== "allow-all" ||
    !["read", "write", "execute", "network"].includes(request.kind)
  )
    return;
  if (
    !request.id ||
    new Set(request.options.map((o) => o.id)).size !== request.options.length ||
    request.options.some((o) => !o.id)
  )
    return;
  const options = request.options.filter((o) => o.kind === "allow-once");
  return options.length === 1 ? options[0]!.id : undefined;
}
