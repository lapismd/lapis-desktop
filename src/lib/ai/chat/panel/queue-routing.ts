import type { QueuedMessage } from "../../conversations/queued-message.ts";
import type { AgentRecipientOption } from "../../conversations/recipients.ts";
import type { AgentRequest } from "../../core/runtime.ts";
import type { AiChatPanelProps } from "./props.ts";
export function queuedRequest(
  q: QueuedMessage,
  props: AiChatPanelProps,
  options: readonly AgentRecipientOption[],
): Omit<AgentRequest, "prompt"> {
  const deliveryTargets = q.selection.targets.map((target, i) => {
    const option = options.find((o) => o.id === target.id);
    if (
      (option && option.agent !== target.agent) ||
      (!option && target.id !== target.agent)
    )
      throw new Error(
        `Queued participant ${q.user.recipients![i]!.label} is no longer available with its original agent`,
      );
    return {
      recipient: q.user.recipients![i]!,
      request: {
        agent: target.agent,
        ...(target.model ? { model: target.model } : {}),
        thinking: target.thinking ?? q.selection.thinking,
      },
    };
  });
  return {
    agent: deliveryTargets[0]!.request.agent,
    recipients: q.user.recipients,
    deliveryTargets,
    thinking: q.selection.thinking,
    contextBlocks: q.user.contextBlocks,
    workspace: props.workspace,
    mcpServers: props.mcpServers ?? [],
    metadata: {
      runtime: q.selection.runtime,
      attachments: q.selection.attachments,
    },
  };
}
