// SPDX-License-Identifier: Apache-2.0
// Exact provider identities replace the legacy semantic-decision fallback.
import type {
  ApprovalKind,
  ApprovalOption,
  ApprovalRequest,
} from "../../core/approvals.ts";
import { record, text } from "./wire.ts";

function optionKind(value: unknown): ApprovalOption["kind"] {
  switch (value) {
    case "allow_once":
      return "allow-once";
    case "allow_always":
      return "allow-always";
    case "reject_once":
      return "deny-once";
    case "reject_always":
      return "deny-always";
    default:
      return "unknown";
  }
}
function approvalKind(value: unknown): ApprovalKind {
  if (value === "read" || value === "search") return "read";
  if (
    value === "edit" ||
    value === "write" ||
    value === "delete" ||
    value === "move"
  )
    return "write";
  if (value === "execute") return "execute";
  if (value === "network" || value === "fetch") return "network";
  return "other";
}
export function mapAcpPermission(
  frame: Record<string, unknown>,
): ApprovalRequest {
  const id = text(frame.permissionId);
  const request = record(frame.request);
  if (!id || !Array.isArray(request.options))
    throw new Error("Invalid ACP permission request");
  const seen = new Set<string>();
  const options = request.options.map((value) => {
    const option = record(value);
    const id = text(option.optionId);
    if (!id || seen.has(id)) throw new Error("Invalid ACP permission option");
    seen.add(id);
    return {
      id,
      label: text(option.name) ?? id,
      kind: optionKind(option.kind),
    };
  });
  const tool = record(request.toolCall);
  return {
    id,
    origin: "runtime",
    kind: approvalKind(tool.kind),
    title: text(tool.title) ?? "Allow this agent action?",
    options,
    tool: {
      name: text(tool.title) ?? text(tool.kind) ?? "acp_tool",
      input: tool.rawInput,
    },
  };
}
