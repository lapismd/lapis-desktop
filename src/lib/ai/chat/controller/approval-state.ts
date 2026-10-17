import { requireApprovalOption } from "../../core/approvals.ts";
// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat orchestration; see ../../NOTICE.md.
import type { ApprovalRequest } from "../../core/approvals.ts";
import {
  approvalGrantIdentity,
  upsertApprovalGrant,
} from "../../conversations/approval-grants.ts";
import { type ConversationMetadata } from "../../conversations/types.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
export function _loadApprovalGrants(
  this: AiChatController,
  metadata: ConversationMetadata,
): void {
  this._approvalGrants = [...(metadata.approvalGrants ?? [])];
}

export async function _rememberPersistentDecision(
  this: AiChatController,
  request: ApprovalRequest,
  optionId: string,
): Promise<void> {
  if (request.origin === "app-tool") return;
  const decision = requireApprovalOption(request, optionId).kind;
  if (decision !== "allow-always" && decision !== "deny-always") return;
  const name = approvalGrantIdentity(request);
  if (!decision || !name) return;
  const nextGrants = upsertApprovalGrant(this._approvalGrants, name, decision);
  const location = this.location;
  if (this.repository && location)
    await this.repository.writeApprovalGrants(location, nextGrants);
  if (
    this.location?.conversationId === location?.conversationId &&
    this.location?.scopeDir === location?.scopeDir
  )
    this._approvalGrants = nextGrants;
}
