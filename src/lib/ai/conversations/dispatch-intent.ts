import type { SavedAgentRecipient } from "./recipients.ts";
import { validateRecipients } from "./recipients.ts";
import {
  assertTimestamp,
  record,
  requiredString,
} from "./validation-fields.ts";
import type { TranscriptEntry } from "./types.ts";
export type DeliveryState =
  | "pending"
  | "started"
  | "completed"
  | "rejected"
  | "unknown"
  | "not_sent"
  | "cancelled";
export type Delivery = {
  id: string;
  recipient: SavedAgentRecipient;
  state: DeliveryState;
  agentBindingId?: string;
};
export type DispatchIntent = {
  version: 1;
  id: string;
  userEntryId: string;
  startedAt: string;
  deliveries: Delivery[];
};
const states: DeliveryState[] = [
  "pending",
  "started",
  "completed",
  "rejected",
  "unknown",
  "not_sent",
  "cancelled",
];
export function validateDelivery(value: unknown): Delivery {
  const d = record(value, "Agent delivery");
  if (
    Object.keys(d).some(
      (k) => !["id", "recipient", "state", "agentBindingId"].includes(k),
    )
  )
    throw new Error("Agent delivery contains unsupported fields");
  if (
    requiredString(d, "id", "Agent delivery").length > 512 ||
    !states.includes(d.state as DeliveryState)
  )
    throw new Error("Agent delivery identity or state is invalid");
  validateRecipients([d.recipient]);
  if (
    d.agentBindingId !== undefined &&
    (typeof d.agentBindingId !== "string" ||
      !d.agentBindingId ||
      d.agentBindingId.length > 512)
  )
    throw new Error("Agent delivery binding is invalid");
  if (d.state === "started" && !d.agentBindingId)
    throw new Error("Started delivery requires a binding");
  return d as Delivery;
}
export function validateDispatchIntent(value: unknown): DispatchIntent {
  const d = record(value, "Pending addressed message");
  if (
    d.version !== 1 ||
    Object.keys(d).some(
      (k) =>
        !["version", "id", "userEntryId", "startedAt", "deliveries"].includes(
          k,
        ),
    )
  )
    throw new Error("Pending addressed message format is unsupported");
  for (const key of ["id", "userEntryId"])
    if (requiredString(d, key, "Pending addressed message").length > 512)
      throw new Error("Pending addressed message identity is too long");
  assertTimestamp(d, "startedAt", "Pending addressed message");
  if (
    !Array.isArray(d.deliveries) ||
    d.deliveries.length < 2 ||
    d.deliveries.length > 4
  )
    throw new Error("An addressed message requires two to four deliveries");
  const deliveries = d.deliveries.map(validateDelivery);
  validateRecipients(deliveries.map((v) => v.recipient));
  if (new Set(deliveries.map((v) => v.id)).size !== deliveries.length)
    throw new Error("Agent delivery identities must be distinct");
  return d as DispatchIntent;
}
export function deliveryEntry(
  intent: DispatchIntent,
  delivery: Delivery,
): Extract<TranscriptEntry, { type: "agent.delivery" }> {
  return {
    schemaVersion: 3,
    type: "agent.delivery",
    id: `delivery:${delivery.id}:${delivery.state}`,
    parentId: intent.userEntryId,
    dispatchId: intent.id,
    createdAt: new Date().toISOString(),
    delivery: structuredClone(delivery),
    provenance: { originClass: "system", sourceKind: "app-system" },
  };
}
