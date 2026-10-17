// SPDX-License-Identifier: Apache-2.0
// App-owned contracts recovered from the pre-controller AI plugin; see NOTICE.md.

export type ApprovalKind = "read" | "write" | "execute" | "network" | "other";

export type ApprovalOptionKind =
  | "allow-once"
  | "allow-session"
  | "allow-always"
  | "deny-once"
  | "deny-always"
  | "unknown";

export type ApprovalOption = {
  id: string;
  label: string;
  kind: ApprovalOptionKind;
};

export type ApprovalRequest = {
  id: string;
  kind: ApprovalKind;
  title: string;
  origin?: "runtime" | "app-tool";
  tool?: {
    name: string;
    input?: unknown;
  };
  options: ApprovalOption[];
  details?: {
    description?: string;
    path?: string;
    diff?: string;
  };
  metadata?: Record<string, unknown>;
};

export type UserInputOption = {
  id: string;
  label: string;
  description?: string;
};

export type UserInputQuestion = {
  id: string;
  header: string;
  prompt: string;
  options?: UserInputOption[];
  allowOther: boolean;
  secret: boolean;
};

export type UserInputRequest = {
  id: string;
  title: string;
  questions: UserInputQuestion[];
};

export type UserInputAnswers = Record<string, string[]>;

/** These are application-tool choices, never substitute ACP provider IDs. */
export const DEFAULT_APPROVAL_OPTIONS: ApprovalOption[] = [
  { id: "allow-once", label: "Allow once", kind: "allow-once" },
  { id: "allow-always", label: "Allow always", kind: "allow-always" },
  { id: "deny-once", label: "Deny once", kind: "deny-once" },
  { id: "deny-always", label: "Deny always", kind: "deny-always" },
];
export const ACP_APPROVAL_CAPABILITIES: ApprovalCapabilities = {
  supported: true,
  interactive: true,
  persistentDecisions: true,
  granularPermissions: true,
  policyAmendments: false,
};
export const UNAVAILABLE_APPROVAL_CAPABILITIES: ApprovalCapabilities = {
  supported: false,
  interactive: false,
  persistentDecisions: false,
  granularPermissions: false,
  policyAmendments: false,
};

export function requireApprovalOption(
  request: ApprovalRequest,
  id: string,
): ApprovalOption {
  const option = request.options.find((option) => option.id === id);
  if (!option) throw new Error("Unknown approval option");
  return option;
}

export type ApprovalCapabilities = {
  supported: boolean;
  interactive: boolean;
  persistentDecisions: boolean;
  granularPermissions: boolean;
  policyAmendments: boolean;
};
