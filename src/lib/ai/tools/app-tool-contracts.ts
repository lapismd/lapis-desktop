// SPDX-License-Identifier: Apache-2.0
// Retained Lapis application-tool policy; see ../NOTICE.md.
import type { createAppToolExecutionScope } from "@lapis-notes/api/agent-tools";
import type { AppToolSessionDescriptor } from "../core/runtime.ts";
import type { AiPluginSettings } from "../settings/ai-settings.ts";
export interface AppToolCapture {
  begin(input: {
    caller: string;
    requestKey: string;
    workspaceId: string;
    captureMode: "cooperative" | "observed";
    intent: string;
    toolName: string;
  }): Promise<{ spanId: string }>;
  finish(input: {
    caller: string;
    requestKey: string;
    workspaceId: string;
    spanId: string;
    outcome: "succeeded" | "failed" | "unknown";
  }): Promise<void>;
}

export type AppToolPolicySettings = Pick<
  AiPluginSettings,
  | "appToolsEnabled"
  | "disabledAppToolNames"
  | "enabledAppToolNames"
  | "enabledCommunityToolPluginIds"
>;

export interface CreateAppToolSessionInput {
  conversationId: string;
  agentBindingId: string;
  scopeDir: string;
  launchNotePath?: string;
  runtimeSupportsAppTools: boolean;
}

export interface AppToolCall {
  runId: string;
  toolCallId: string;
  name: string;
  input: unknown;
}

export interface ActiveAppToolSession {
  descriptor: AppToolSessionDescriptor;
  scope: ReturnType<typeof createAppToolExecutionScope>;
}
