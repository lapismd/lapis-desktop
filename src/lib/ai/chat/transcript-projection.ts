// SPDX-License-Identifier: Apache-2.0
import type {
  TranscriptBlock,
  TranscriptItem,
  TranscriptTool,
} from "@lapismd/design-core/chat";
import type { AgentBindingCreatedRecord } from "../conversations/types.ts";
import { isSlashCommandNotice, type AiChatItem } from "./chat-items.ts";
import { bindingLabels } from "./panel/binding-labels.ts";
import { toolCallStatus, isLocalCommandTool } from "./chat-tool-display.ts";
import { discussionReplyContexts } from "./transcript-discussions.ts";
import { agentAvatar } from "../presentation/agent-avatar.ts";
import type { AgentRecipientOption } from "../conversations/recipients.ts";

/** Display-only revision. Native source IDs and receipt authority remain untouched. */
function revision(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++)
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return `display-${(hash >>> 0).toString(16)}-${text.length}`;
}
function block(
  item: AiChatItem,
  text: string,
  kind: TranscriptBlock["kind"],
  label: string,
  suffix = "body",
): TranscriptBlock {
  return {
    id: `${item.id}/${suffix}`,
    revision: revision(text),
    text,
    kind,
    label,
    commentable: true,
  };
}
function text(item: AiChatItem): string {
  if (item.type === "tool") return item.output ?? item.input ?? "";
  if (item.type === "approval") return `Permission ${item.status}`;
  if (item.type === "question") return `Question ${item.status}`;
  return item.text;
}
function tool(item: Extract<AiChatItem, { type: "tool" }>): TranscriptTool {
  return {
    id: item.id,
    revision: revision(JSON.stringify([item.state, item.input, item.output])),
    title: item.name,
    status: toolCallStatus(item.state),
    blocks: [
      {
        ...block(
          item,
          item.output ?? item.input ?? "",
          "custom",
          `${item.name} details`,
          "detail",
        ),
        ...(isLocalCommandTool(item) ? { surface: "plain" as const } : {}),
      },
    ],
    raw: JSON.stringify({
      name: item.name,
      state: item.state,
      input: item.input,
      output: item.output,
    }),
    commentable: true,
  };
}

/** One presentation of retained controller data; this never executes or persists work. */
export function projectAiTranscript(
  source: readonly AiChatItem[],
  bindings: readonly AgentBindingCreatedRecord[] = [],
  profiles: readonly AgentRecipientOption[] = [],
): TranscriptItem[] {
  const agents = new Map(bindings.map((binding) => [binding.id, binding]));
  const items: TranscriptItem[] = [];
  let turn: TranscriptItem["turn"];
  let previousBinding: string | undefined;
  const labels = bindingLabels([...bindings]);
  const replyContexts = discussionReplyContexts(source, bindings);
  for (const item of source) {
    const binding = item.agentBindingId
      ? agents.get(item.agentBindingId)
      : undefined;
    const profile = binding?.participant
      ? profiles.find(
          (p) => p.id === binding.participant?.id && p.agent === binding.agent,
        )
      : undefined;
    if (
      (item.type === "approval" || item.type === "question") &&
      item.status === "pending"
    )
      continue;
    const dayLabel =
      item.agentBindingId && item.agentBindingId !== previousBinding
        ? labels.get(item.agentBindingId)
        : undefined;
    if (dayLabel) previousBinding = item.agentBindingId;
    if (item.type === "message" && item.role === "user") {
      turn = {
        id: item.id,
        author: "You",
        prompt: item.text,
        summary: "",
        agentName: binding?.participant?.label ?? binding?.agent,
        modelLabel: binding?.model?.model,
        createdAt: item.createdAt ? Date.parse(item.createdAt) : undefined,
      };
    }
    if (item.type === "tool") {
      const previous = items.at(-1);
      if (
        previous?.kind === "tools" &&
        previous.turn?.id === turn?.id &&
        !isLocalCommandTool(item) &&
        !previous.defaultExpanded &&
        !dayLabel
      ) {
        previous.tools = [...(previous.tools ?? []), tool(item)];
      } else {
        items.push({
          id: `tools/${item.id}`,
          kind: "tools",
          dayLabel,
          label: "Tool activity",
          defaultExpanded: isLocalCommandTool(item),
          turn,
          blocks: [],
          tools: [tool(item)],
        });
      }
      continue;
    }
    const value = text(item);
    const message = item.type === "message";
    const label = message
      ? item.role === "user"
        ? "Your message"
        : "Assistant response"
      : item.type === "thinking"
        ? item.kind === "plan"
          ? "Plan"
          : "Reasoning"
        : item.type === "error"
          ? "Turn interrupted"
          : item.type === "approval"
            ? "Permission response"
            : item.type === "question"
              ? "Question response"
              : item.type === "skill-activation"
                ? "Skill activation"
                : item.type === "command"
                  ? "Command result"
                  : "Context and activity";
    const custom =
      item.type === "status" ||
      item.type === "command" ||
      item.type === "skill-activation";
    items.push({
      id: item.id,
      kind: message
        ? "message"
        : item.type === "thinking"
          ? "reasoning"
          : "context",
      label,
      notice: item.type === "error" ? "error" : undefined,
      replyContext: replyContexts.get(item.id),
      dayLabel,
      role: message ? item.role : undefined,
      author: message
        ? item.role === "user"
          ? { id: "local-user", name: "You", initials: "YO" }
          : {
              id:
                binding?.participant?.id ?? item.agentBindingId ?? "assistant",
              name:
                binding?.participant?.label ?? binding?.agent ?? "Assistant",
              initials: profile ? undefined : "AI",
              image: profile ? profile.avatar : agentAvatar(binding?.agent),
              background: profile?.avatarBackground,
              shape: "rounded",
            }
        : undefined,
      turn,
      createdAt: item.createdAt,
      sentContext: item.contextBlocks?.length
        ? {
            content: item.contextBlocks
              .map((block) => block.content)
              .join("\n\n"),
            rawContent: JSON.stringify(item.contextBlocks, null, 2),
            rawLanguage: "json",
            delivery: item.contextDelivery ?? "prepared",
          }
        : undefined,
      defaultExpanded:
        item.type === "thinking"
          ? item.state === "streaming"
          : item.type === "error" ||
            (item.type === "status" && item.layout !== undefined),
      blocks: [
        {
          ...block(item, value, custom ? "custom" : "markdown", label),
          ...(isSlashCommandNotice(item) ? { surface: "plain" as const } : {}),
          ...(item.type === "error" ? { commentable: false } : {}),
        },
      ],
    });
  }
  return items;
}

export function transcriptSourceItem(
  block: TranscriptBlock,
  items: readonly AiChatItem[],
): AiChatItem | undefined {
  return items.find(
    (item) =>
      block.id === `${item.id}/body` || block.id === `${item.id}/detail`,
  );
}
