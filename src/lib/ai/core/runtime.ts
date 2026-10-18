// SPDX-License-Identifier: Apache-2.0
// App-owned contracts recovered from the pre-controller AI plugin; see NOTICE.md.
import type {
  AgentSessionConfiguration,
  AgentSessionConfigurationResult,
  AiThinkingLevel,
  ModelRef,
} from "./models.ts";
import type { SkillActivation, SkillSnapshot } from "../skills/types.ts";
import type { ApprovalCapabilities, UserInputAnswers } from "./approvals.ts";
import type { AgentEvent } from "./events.ts";
import type { AgentTurnOptions } from "./context.ts";

export type McpServerContribution = {
  name: string;
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  enabledTools?: string[];
};

export type AppToolDescriptor = {
  registrationId: string;
  ownerPluginId: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  effect: "read" | "write" | "external";
};

export type AppToolSessionDescriptor = {
  conversationId: string;
  agentBindingId: string;
  scopeDir: string;
  launchNotePath?: string;
  tools: AppToolDescriptor[];
  bridgeId?: string;
  status?:
    | "available"
    | "disabled"
    | "host-upgrade-required"
    | "runtime-unavailable";
  unavailableReason?: string;
};

export type AgentRequest = {
  prompt: string;
  contextBlocks?: import("./context.ts").AgentContextBlock[];
  workspace?: string;
  agent?: string;
  model?: ModelRef;
  thinking?: AiThinkingLevel;
  metadata?: Record<string, unknown>;
  mcpServers?: McpServerContribution[];
  appToolSession?: AppToolSessionDescriptor;
  skillSnapshot?: SkillSnapshot;
  skillActivations?: SkillActivation[];
  restricted?: boolean;
  approvalPolicy?: "ask" | "allow-all";
  requireApprovals?: boolean;
  requirePolicyAmendments?: boolean;
};

export type AgentCapabilities = {
  preparesContext?: boolean;
  sessions: boolean;
  resume: boolean;
  cancel: boolean;
  steer: boolean;
  modelSelection: boolean;
  nativeTools: boolean;
  mcpTools: boolean;
  approvals: ApprovalCapabilities;
};

export interface AgentSession {
  readonly id: string;
  events(): AsyncIterable<AgentEvent>;
  send(input: string, options?: AgentTurnOptions): Promise<void>;
  configure?(
    input: AgentSessionConfiguration,
  ): Promise<AgentSessionConfigurationResult>;
  respondToApproval(requestId: string, optionId: string): Promise<void>;
  cancelApproval?(requestId: string): Promise<void>;
  respondToQuestion?(
    requestId: string,
    answers: UserInputAnswers,
  ): Promise<void>;
  cancel?(): Promise<void>;
  detach?(): Promise<void>;
  steer?(instruction: string): Promise<void>;
  close(): Promise<void>;
}

export interface AgentRuntime {
  readonly id: string;
  capabilities(): AgentCapabilities;
  supports(request: AgentRequest): Promise<boolean>;
  start(request: AgentRequest): Promise<AgentSession>;
  resume?(
    sessionId: string,
    request?: Omit<AgentRequest, "prompt">,
  ): Promise<AgentSession>;
}
