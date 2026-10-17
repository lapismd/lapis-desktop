// SPDX-License-Identifier: Apache-2.0
// Retained Lapis application-tool policy; see ../NOTICE.md.
export type AppToolExecutionErrorCode =
  | "approval_denied"
  | "cancelled"
  | "capture_unavailable"
  | "execution_failed"
  | "invalid_arguments"
  | "invalid_result"
  | "invalid_tool_schema"
  | "timed_out"
  | "tool_unavailable";

export class AppToolExecutionError extends Error {
  constructor(
    readonly code: AppToolExecutionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppToolExecutionError";
  }
}

export function unavailableError(name: string): AppToolExecutionError {
  return new AppToolExecutionError(
    "tool_unavailable",
    `App tool is unavailable for this binding: ${name}`,
  );
}

export function invalidResult(name: string): AppToolExecutionError {
  return new AppToolExecutionError(
    "invalid_result",
    `App tool returned an invalid or oversized result: ${name}`,
  );
}

export function cancelledError(): AppToolExecutionError {
  return new AppToolExecutionError("cancelled", "App tool call cancelled.");
}
