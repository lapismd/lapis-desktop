import type { AgentRequest } from "../../core/runtime.ts";
import {
  recipientFromOption,
  validateRecipients,
} from "../../conversations/recipients.ts";
import { persistableCommentContexts } from "../../conversations/comment-context.ts";
import {
  validateQueuedMessage,
  type QueuedMessage,
} from "../../conversations/queued-message.ts";
import type { AcpAgentId } from "../../settings/acp-agents.ts";
export function captureQueuedMessage(
  prompt: string,
  request: Omit<AgentRequest, "prompt">,
): QueuedMessage {
  if (prompt.trim().startsWith("/"))
    throw new Error(
      "Application commands cannot be queued. Wait for the active turn to finish",
    );
  const recipients = validateRecipients(request.recipients);
  if (!recipients.length)
    recipients.push(
      recipientFromOption({
        id: request.agent ?? "",
        label:
          { codex: "Codex", cursor: "Cursor", opencode: "OpenCode" }[
            request.agent as AcpAgentId
          ] ?? "",
        agent: request.agent as AcpAgentId,
      }),
    );
  const user = {
    schemaVersion: 3 as const,
    id: `queued-user-${crypto.randomUUID()}`,
    type: "message" as const,
    role: "user" as const,
    text: prompt.trim(),
    recipients,
    createdAt: new Date().toISOString(),
    ...(request.contextBlocks?.length
      ? { contextBlocks: persistableCommentContexts(request.contextBlocks) }
      : {}),
    provenance: {
      originClass: "owner" as const,
      sourceKind: "user-message" as const,
    },
  };
  const queued: QueuedMessage = {
    version: 1,
    id: crypto.randomUUID(),
    state: "queued",
    user,
    selection: {
      targets: recipients.map((r, i) => {
        const target = request.deliveryTargets?.[i]?.request ?? request;
        return {
          id: r.id,
          agent: target.agent as AcpAgentId,
          ...(target.model ? { model: structuredClone(target.model) } : {}),
          ...((target.thinking ?? request.thinking)
            ? { thinking: target.thinking ?? request.thinking }
            : {}),
        };
      }),
      runtime: (request.metadata?.runtime ??
        "acp") as QueuedMessage["selection"]["runtime"],
      ...(request.thinking ? { thinking: request.thinking } : {}),
      attachments: structuredClone(
        (request.metadata?.attachments ?? []) as string[],
      ),
    },
  };
  return validateQueuedMessage(queued);
}
