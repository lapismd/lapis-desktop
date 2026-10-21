import { markApprovalResponse } from "../chat-trace.ts";
import type { AiChatItem } from "../chat-items.ts";
import type { ApprovalRequest } from "../../core/approvals.ts";
import {
  automaticApprovalOption,
  normalizeApprovalPolicy,
  type ApprovalPolicy,
} from "../../core/approval-policy.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
import { waitForNextTask } from "./turn.ts";
import { persistentDecisionForRequest } from "../../conversations/approval-grants.ts";

export function currentApprovalPolicy(
  controller: AiChatController,
): ApprovalPolicy {
  const request = controller._sessionRequest;
  return request.restricted
    ? "ask"
    : normalizeApprovalPolicy(
        controller._approvalPolicy?.(request) ?? request.approvalPolicy,
      );
}

/** Called only when a fresh live event has been projected; never during restore. */
export async function automaticallyRespond(
  controller: AiChatController,
  request: ApprovalRequest,
  bindingId: string | undefined,
  capturedPolicy: ApprovalPolicy,
): Promise<string | undefined> {
  const optionId = automaticApprovalOption(capturedPolicy, request);
  if (
    persistentDecisionForRequest(controller._approvalGrants, request) ===
    "deny-always"
  )
    return;
  const session = controller.session,
    turn = controller._turnId,
    location = controller.location;
  const current = () =>
    !controller._disposed &&
    controller.session === session &&
    !!session &&
    !controller._cancelledSessions.has(session) &&
    controller._turnId === turn &&
    controller._activeBindingId === bindingId &&
    controller.location === location &&
    currentApprovalPolicy(controller) === "allow-all";
  if (!optionId || !current()) return;
  const item = controller.items.find(
    (i) =>
      i.type === "approval" &&
      i.request === request &&
      i.agentBindingId === bindingId &&
      i.status === "pending",
  );
  if (!item) return;
  try {
    // Persist before answering and recheck identity after every asynchronous barrier.
    if (controller.repository && location)
      await controller._appendDurableItems(location, [item], bindingId);
    else await controller._persist(false, bindingId);
    await waitForNextTask();
    if (!current() || !controller.items.some((i) => i === item)) return;
    await controller.respondToApproval(request.id, optionId, item.id);
    return optionId;
  } catch (error) {
    controller._onApprovalError?.(error);
    // A failed durable response write cannot erase an acknowledged decision.
    return controller.items.some(
      (i) =>
        i.id === item.id &&
        i.type === "approval" &&
        i.request === request &&
        i.status === "approved",
    )
      ? optionId
      : undefined;
  }
}

/** Existing explicit conversation grants retain priority over the default policy. */
export async function answerStoredApproval(
  controller: AiChatController,
  session: import("../../core/runtime.ts").AgentSession,
  request: ApprovalRequest,
): Promise<boolean> {
  const decision = persistentDecisionForRequest(
    controller._approvalGrants,
    request,
  );
  const option = request.options.find((o) => o.kind === decision);
  if (!decision || !option) return false;
  try {
    await waitForNextTask();
    if (
      controller.session === session &&
      !controller._disposed &&
      !controller._cancelledSessions.has(session)
    ) {
      await session.respondToApproval(request.id, option.id);
      return true;
    }
  } catch {
    /* An unmatched request stays interactive. */
  }
  return false;
}

export async function approveRuntimeRequest(
  controller: AiChatController,
  request: ApprovalRequest,
  bindingId: string | undefined,
  policy: ApprovalPolicy,
  trace: AiChatItem[],
): Promise<AiChatItem[]> {
  const option = await automaticallyRespond(
    controller,
    request,
    bindingId,
    policy,
  );
  return option ? markApprovalResponse(trace, request.id, option) : trace;
}
