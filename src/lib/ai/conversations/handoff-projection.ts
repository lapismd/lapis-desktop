// SPDX-License-Identifier: Apache-2.0
// Adapted from the pre-controller AI handoff; see ../NOTICE.md.
import type { TranscriptEntry } from "./types.ts";
import { messageEvidence } from "./comment-receipt.ts";
export type ProjectionGroup = { entryIds: string[]; text: string };

export function projectEntry(
  entry: TranscriptEntry,
  bindingLabels: ReadonlyMap<string, string>,
): ProjectionGroup[] {
  const agent = entry.agentBindingId
    ? bindingLabels.get(entry.agentBindingId)
    : undefined;
  switch (entry.type) {
    case "message": {
      const label =
        entry.role === "user"
          ? "User"
          : `Assistant${agent ? ` (${agent})` : ""}`;
      return [
        { entryIds: [entry.id], text: `[${label}]\n${messageEvidence(entry)}` },
      ];
    }
    case "tool":
      return [
        {
          entryIds: [entry.id],
          text: [
            `[Tool evidence${agent ? ` from ${agent}` : ""}: ${entry.name}; state=${entry.state}; trust=untrusted${entry.redacted ? "; redacted=true" : ""}${entry.truncated ? "; truncated=true" : ""}]`,
            entry.input ? `Input:\n${entry.input}` : undefined,
            entry.output ? `Output:\n${entry.output}` : undefined,
          ]
            .filter((value): value is string => Boolean(value))
            .join("\n"),
        },
      ];
    case "agent.switch":
      return [
        {
          entryIds: [entry.id],
          text: `[Agent switch: ${entry.fromBindingId ?? "none"} -> ${entry.toBindingId}]`,
        },
      ];
    case "agent.config":
      return [
        {
          entryIds: [entry.id],
          text: `[Agent configuration${entry.model?.model ? `: model=${entry.model.model}` : ""}${entry.thinking ? `; thinking=${entry.thinking}` : ""}]`,
        },
      ];
    case "command":
      return [
        {
          entryIds: [entry.id],
          text: `[Command /${entry.command}; origin=${entry.origin}; status=${entry.status}]${entry.arguments ? `\n${entry.arguments}` : ""}`,
        },
      ];
    case "error":
      return [
        { entryIds: [entry.id], text: `[Runtime error]\n${entry.message}` },
      ];
    case "cancelled":
      return [
        {
          entryIds: [entry.id],
          text: `[Turn cancelled${entry.text ? `: ${entry.text}` : ""}]`,
        },
      ];
    default:
      return [];
  }
}
