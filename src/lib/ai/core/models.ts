// SPDX-License-Identifier: Apache-2.0
// App-owned contracts recovered from the pre-controller AI plugin; see NOTICE.md.

export type ModelRef = {
  provider: string;
  model: string;
  displayName?: string;
  badges?: string[];
  description?: string;
  isDefault?: boolean;
  supportedThinking?: AiThinkingLevel[];
};

export type AiThinkingLevel = "default" | "off" | "low" | "medium" | "high";

export type AgentUsage = {
  used: number;
  limit: number;
  cost?: number;
};

export type AgentSessionConfiguration = {
  executionMode?: string;
  model?: ModelRef;
  thinking?: AiThinkingLevel;
};

export type AgentSessionConfigurationFieldResult = {
  status: "applied" | "unchanged" | "unsupported";
  reason?: string;
};

export type AgentSessionConfigurationResult = {
  executionMode?: AgentSessionConfigurationFieldResult;
  model?: AgentSessionConfigurationFieldResult;
  thinking?: AgentSessionConfigurationFieldResult;
};
