import { AgentTurnFailure } from "./wire.ts";

/** Native prompt IDs are canonical UUIDs; they are never inferred from text. */
export function acpTurnRequestId(value?: string): string {
  if (value === undefined) return crypto.randomUUID();
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u.test(
      value,
    )
  )
    throw new AgentTurnFailure("invalid_authored_request_identity", "rejected");
  return value;
}
