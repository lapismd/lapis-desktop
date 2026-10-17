// SPDX-License-Identifier: Apache-2.0
// Retained lapis-plugins ee20d366 shell fixtures; see src/lib/ai/NOTICE.md.
export type ShellScenario =
  | "default"
  | "initializing"
  | "local-conversations"
  | "follow-scope"
  | "agent-switching"
  | "recovery"
  | "jsonl-preview"
  | "community-tools"
  | "reload-resume"
  | "registry-chat"
  | "registry-overview";
export const LOCAL_CONVERSATION_ID = "123e4567-e89b-42d3-a456-426614174000";
export const ARCHIVED_CONVERSATION_ID = "223e4567-e89b-42d3-a456-426614174001";
export const RECOVERY_CONVERSATION_ID = "323e4567-e89b-42d3-a456-426614174002";
export const FOLLOW_NEAR_CONVERSATION_ID =
  "523e4567-e89b-42d3-a456-426614174004";
export const FOLLOW_FAR_CONVERSATION_ID =
  "623e4567-e89b-42d3-a456-426614174005";
export const LIVE_HOST_RELOAD_CONVERSATION_ID =
  "423e4567-e89b-42d3-a456-426614174003";
