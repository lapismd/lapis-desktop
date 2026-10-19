// SPDX-License-Identifier: Apache-2.0
// Retained from the Lapis AI plugin; see ../NOTICE.md.
import {
  MAX_CONVERSATION_APPROVAL_GRANTS,
  normalizeApprovalGrants,
} from "./approval-grants.ts";
import type { ConversationMetadata } from "./types.ts";
import { validateDispatchIntent } from "./dispatch-intent.ts";
import { validateTurnIntent } from "./turn-intent.ts";
import { assertConversationId } from "./paths.ts";
import {
  record,
  assertSchemaVersion,
  requiredString,
  assertTimestamp,
  assertOptionalString,
  assertPortableOptionalPath,
} from "./validation-fields.ts";
export function validateConversationMetadata(
  value: unknown,
): ConversationMetadata {
  const data = record(value, "Conversation metadata");
  assertSchemaVersion(data, "Conversation metadata");
  assertConversationId(requiredString(data, "id", "Conversation metadata"));
  assertTimestamp(data, "createdAt", "Conversation metadata");
  assertTimestamp(data, "updatedAt", "Conversation metadata");
  if (data.status !== "active" && data.status !== "archived") {
    throw new Error("Conversation metadata.status is invalid");
  }
  if (data.title != null && typeof data.title !== "string") {
    throw new Error("Conversation metadata.title must be a string");
  }
  if (
    typeof data.title === "string" &&
    (/\r|\n/u.test(data.title) || [...data.title].length > 80)
  ) {
    throw new Error(
      "Conversation metadata.title must be one line of at most 80 code points",
    );
  }
  assertOptionalString(data, "activeAgentBindingId", "Conversation metadata");
  if (data.launchContext != null) {
    const launch = record(data.launchContext, "Conversation launchContext");
    assertPortableOptionalPath(
      launch.notePath,
      "Conversation launchContext.notePath",
    );
  }
  if (data.workspace != null) {
    const workspace = record(data.workspace, "Conversation workspace");
    requiredString(workspace, "path", "Conversation workspace");
    assertPortableOptionalPath(workspace.path, "Conversation workspace.path");
  }
  if (data.approvalGrants != null) {
    if (!Array.isArray(data.approvalGrants)) {
      throw new Error("Conversation metadata.approvalGrants must be an array");
    }
    if (data.approvalGrants.length > MAX_CONVERSATION_APPROVAL_GRANTS) {
      throw new Error(
        "Conversation metadata.approvalGrants exceeds the stored limit",
      );
    }
    const grants = normalizeApprovalGrants(data.approvalGrants);
    if (grants.length > 0) data.approvalGrants = grants;
    else delete data.approvalGrants;
  }
  if (data.pinned != null && typeof data.pinned !== "boolean") {
    throw new Error("Conversation metadata.pinned must be a boolean");
  }
  if (data.pinned === false) delete data.pinned;
  if (data.pendingDispatch != null)
    validateDispatchIntent(data.pendingDispatch);
  if (data.pendingTurn != null) validateTurnIntent(data.pendingTurn);
  return data as ConversationMetadata;
}
