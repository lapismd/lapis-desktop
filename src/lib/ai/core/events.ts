// SPDX-License-Identifier: Apache-2.0
// App-owned contracts recovered from the pre-controller AI plugin; see NOTICE.md.
import type { ApprovalRequest, UserInputRequest } from "./approvals.ts";
import type { AgentUsage } from "./models.ts";
import type { NativeAgentCommand } from "../skills/types.ts";

export type AgentEventSource = {
  sessionId: string;
  runId: string;
  sequence: number;
};

export type AgentEvent = (
  | {
      type: "text";
      text: string;
      messageId?: string;
      complete?: boolean;
    }
  | {
      type: "provider_extension";
      sourceType: string;
      observation: unknown;
    }
  | {
      type: "message_complete";
    }
  | {
      type: "thinking";
      text: string;
      kind?: "reasoning" | "summary" | "plan";
    }
  | {
      type: "tool.start";
      id: string;
      name: string;
      server?: string;
      kind?: string;
      title?: string;
      command?: string;
      locations?: unknown[];
      input?: unknown;
    }
  | {
      type: "tool.end";
      id: string;
      name: string;
      server?: string;
      kind?: string;
      title?: string;
      command?: string;
      locations?: unknown[];
      content?: unknown;
      input?: unknown;
      output?: unknown;
      error?: unknown;
    }
  | {
      type: "file.changed";
      path: string;
    }
  | {
      type: "command.start";
      command: string;
    }
  | {
      type: "command.end";
      command: string;
      exitCode: number;
    }
  | {
      type: "permission.request";
      request: ApprovalRequest;
    }
  | {
      type: "question.request";
      request: UserInputRequest;
    }
  | {
      type: "usage";
      usage: AgentUsage;
    }
  | {
      type: "status";
      status: string;
    }
  | {
      type: "commands.update";
      commands: NativeAgentCommand[];
    }
  | {
      type: "completed";
      result?: unknown;
    }
  | {
      type: "error";
      error: Error;
    }
) & {
  source?: AgentEventSource;
  observation?: unknown;
};
