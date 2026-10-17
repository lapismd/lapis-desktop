// SPDX-License-Identifier: Apache-2.0
// Retained Lapis application-tool policy; see ../NOTICE.md.
import type {
  AppToolApprovalDetails,
  RegisteredAppTool,
} from "@lapis-notes/api/agent-tools";
import type { ApprovalRequest, ApprovalOptionKind } from "../core/approvals.ts";
import { AppToolExecutionError, cancelledError } from "./app-tool-errors.ts";
export type AppToolApprovalListener = (
  request: ApprovalRequest,
  bindingId: string,
) => void;

interface PendingApproval {
  bindingId: string;
  resolve: (decision: ApprovalOptionKind) => void;
  reject: (error: AppToolExecutionError) => void;
  removeAbortListener: () => void;
}

export class AppToolApprovalBroker {
  readonly #listeners = new Set<AppToolApprovalListener>();
  readonly #pending = new Map<string, PendingApproval>();
  #sequence = 0;

  subscribe(listener: AppToolApprovalListener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  request(
    bindingId: string,
    tool: RegisteredAppTool,
    input: unknown,
    details: AppToolApprovalDetails | undefined,
    signal: AbortSignal,
  ): Promise<ApprovalOptionKind> {
    if (signal.aborted) {
      return Promise.reject(cancelledError());
    }
    const id = `app-tool-approval-${++this.#sequence}`;
    const request: ApprovalRequest = {
      id,
      origin: "app-tool",
      kind: tool.tool.effect === "external" ? "network" : "write",
      title: details?.title ?? `Allow ${tool.tool.name}`,
      tool: { name: tool.tool.name, input },
      options: [
        { id: "allow-once", label: "Allow once", kind: "allow-once" },
        {
          id: "allow-session",
          label: "Allow for this session",
          kind: "allow-session",
        },
        { id: "deny-once", label: "Deny", kind: "deny-once" },
      ],
      details: {
        description: details?.description,
        path: details?.path ?? details?.paths?.join(", "),
        diff: formatApprovalDiff(details),
      },
    };

    const decision = new Promise<ApprovalOptionKind>((resolve, reject) => {
      const onAbort = () => {
        const pending = this.#pending.get(id);
        if (!pending) return;
        this.#pending.delete(id);
        pending.removeAbortListener();
        reject(cancelledError());
      };
      signal.addEventListener("abort", onAbort, { once: true });
      this.#pending.set(id, {
        bindingId,
        resolve,
        reject,
        removeAbortListener: () => signal.removeEventListener("abort", onAbort),
      });
    });

    for (const listener of this.#listeners) listener(request, bindingId);
    return decision;
  }

  respond(requestId: string, decision: ApprovalOptionKind): boolean {
    const pending = this.#pending.get(requestId);
    if (!pending) return false;
    if (!isAppToolApprovalDecision(decision)) return false;
    this.#pending.delete(requestId);
    pending.removeAbortListener();
    pending.resolve(decision);
    return true;
  }

  closeBinding(bindingId: string): void {
    for (const [requestId, pending] of this.#pending) {
      if (pending.bindingId !== bindingId) continue;
      this.#pending.delete(requestId);
      pending.removeAbortListener();
      pending.reject(cancelledError());
    }
  }

  close(): void {
    for (const pending of this.#pending.values()) {
      pending.removeAbortListener();
      pending.reject(cancelledError());
    }
    this.#pending.clear();
    this.#listeners.clear();
  }
}

function formatApprovalDiff(
  details: AppToolApprovalDetails | undefined,
): string | undefined {
  if (!details) return undefined;
  const hunks = [
    ...(details.diff
      ? [
          {
            path: details.path,
            before: details.diff.before,
            after: details.diff.after,
          },
        ]
      : []),
    ...(details.diffs ?? []),
  ];
  if (hunks.length === 0) return undefined;
  return hunks
    .map((hunk) => {
      const header = hunk.path ? `# ${hunk.path}\n` : "";
      return `${header}--- before\n${hunk.before}\n+++ after\n${hunk.after}`;
    })
    .join("\n\n");
}

function isAppToolApprovalDecision(
  decision: ApprovalOptionKind,
): decision is "allow-once" | "allow-session" | "deny-once" {
  return ["allow-once", "allow-session", "deny-once"].includes(decision);
}
