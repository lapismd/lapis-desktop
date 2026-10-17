// SPDX-License-Identifier: Apache-2.0
export function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
export function text(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
export class AgentTurnFailure extends Error {
  readonly outcome: "rejected" | "unknown";
  constructor(code: string, outcome: "rejected" | "unknown" = "unknown") {
    super(code);
    this.name = "AgentTurnFailure";
    this.outcome = outcome;
  }
}
