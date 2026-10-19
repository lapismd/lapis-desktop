// SPDX-License-Identifier: Apache-2.0
// Retains the pre-controller event seam while consuming raw control-v3 updates.
import type { AgentEvent, AgentEventSource } from "../../core/events.ts";
import {
  isGenericToolName,
  toolNameFromInput,
} from "../../chat/chat-tool-identity.ts";
import { record, text, AgentTurnFailure } from "./wire.ts";

export function mapAcpActivity(
  value: unknown,
  source: AgentEventSource,
  ownedMcpServer?: string,
): AgentEvent {
  const update = record(value);
  const kind = text(update.sessionUpdate) ?? "unknown";
  const observation = value;
  const extend = (event: AgentEvent): AgentEvent => ({
    ...event,
    source,
    observation,
  });
  const extension = (): AgentEvent => ({
    type: "provider_extension",
    sourceType: kind,
    source,
    observation,
  });
  if (kind === "agent_message_chunk" || kind === "agent_thought_chunk") {
    const content = record(update.content);
    if (content.type !== "text" || typeof content.text !== "string")
      return extension();
    return extend(
      kind === "agent_message_chunk"
        ? { type: "text", text: content.text }
        : { type: "thinking", text: content.text, kind: "reasoning" },
    );
  }
  if (kind === "tool_call" || kind === "tool_call_update") {
    const id = text(update.toolCallId);
    if (!id) return extension();
    const title = text(update.title);
    const name = !isGenericToolName(title)
      ? title!
      : (toolNameFromInput(update.rawInput) ?? text(update.kind) ?? "acp_tool");
    const fields = {
      id,
      name,
      title,
      kind: text(update.kind),
      server:
        text(update.server) ??
        (ownedMcpServer &&
        (name.startsWith(`mcp.${ownedMcpServer}.`) ||
          text(record(update.rawInput).server) === ownedMcpServer)
          ? ownedMcpServer
          : undefined),
      input: update.rawInput,
      locations: Array.isArray(update.locations) ? update.locations : undefined,
      content: update.content,
    };
    return extend(
      update.status === "completed" ||
        update.status === "failed" ||
        update.status === "cancelled"
        ? {
            type: "tool.end",
            ...fields,
            output: update.rawOutput ?? update.content,
            error:
              update.status === "failed"
                ? (update.rawOutput ?? update.content ?? "Agent tool failed")
                : update.status === "cancelled"
                  ? "Agent tool cancelled"
                  : undefined,
          }
        : { type: "tool.start", ...fields },
    );
  }
  if (
    kind === "available_commands_update" &&
    Array.isArray(update.availableCommands)
  ) {
    return extend({
      type: "commands.update",
      commands: update.availableCommands.flatMap((value) => {
        const command = record(value);
        const name = text(command.name)?.trim();
        return name
          ? [
              {
                name,
                description: text(command.description),
                argumentHint: text(record(command.input).hint),
              },
            ]
          : [];
      }),
    });
  }
  if (
    kind === "usage_update" &&
    typeof update.used === "number" &&
    Number.isFinite(update.used) &&
    update.used >= 0 &&
    typeof update.size === "number" &&
    Number.isFinite(update.size) &&
    update.size > 0
  ) {
    return extend({
      type: "usage",
      usage: {
        used: update.used,
        limit: update.size,
        ...(typeof update.cost === "number" &&
        Number.isFinite(update.cost) &&
        update.cost >= 0
          ? { cost: update.cost }
          : {}),
      },
    });
  }
  if (kind === "plan" && Array.isArray(update.entries)) {
    const lines = update.entries.flatMap((value) => {
      const item = record(value);
      return typeof item.content === "string"
        ? [`${text(item.status) ?? "pending"}: ${item.content}`]
        : [];
    });
    if (lines.length)
      return extend({ type: "thinking", text: lines.join("\n"), kind: "plan" });
  }
  return extension();
}

export function mapAcpTerminal(
  frame: Record<string, unknown>,
  source: AgentEventSource,
): AgentEvent {
  const result = record(frame.record);
  if (frame.type === "record" && result.status === "completed")
    return { type: "completed", result, source, observation: frame };
  const outcome =
    result.status === "invalid" || frame.type === "error"
      ? "rejected"
      : "unknown";
  return {
    type: "error",
    error: new AgentTurnFailure(
      text(result.error) ?? text(frame.code) ?? "ACP turn outcome unknown",
      outcome,
    ),
    source,
    observation: frame,
  };
}
