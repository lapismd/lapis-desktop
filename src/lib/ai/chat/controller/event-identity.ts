import type { ChatItemIdentity } from "../chat-trace.ts";

/** Both projections share one creation identity; native tool/request IDs stay separate. */
export function eventIdentity(
  bindingId?: string,
): ChatItemIdentity | undefined {
  if (!bindingId) return undefined;
  const eventId = crypto.randomUUID();
  return (kind, provided) => `${bindingId}:${provided ?? `${kind}-${eventId}`}`;
}
