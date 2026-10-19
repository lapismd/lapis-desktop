import type { AiChatItem } from "./chat-items.ts";
import { isGenericToolName, isEmptyToolInput } from "./chat-tool-identity.ts";
import { APP_TOOL_MCP_SERVER_NAME } from "../tools/mcp-server-registry.ts";

export function findToolItemIndex(
  items: AiChatItem[],
  event: { id: string; name: string; server?: string; input?: unknown },
): number {
  const exact = items.findIndex(
    (item) =>
      item.type === "tool" &&
      (item.toolId === event.id || item.id === event.id),
  );
  if (exact >= 0) return exact;

  const incomingApp = event.server === APP_TOOL_MCP_SERVER_NAME;
  const incomingGeneric =
    !incomingApp &&
    isGenericToolName(event.name) &&
    isEmptyToolInput(event.input);

  if (incomingApp) {
    return items.findIndex(
      (item) =>
        item.type === "tool" &&
        item.server !== APP_TOOL_MCP_SERVER_NAME &&
        isGenericToolName(item.name) &&
        originalToolIdentity(item),
    );
  }
  if (incomingGeneric) {
    return items.findIndex(
      (item) =>
        item.type === "tool" &&
        item.server === APP_TOOL_MCP_SERVER_NAME &&
        originalToolIdentity(item),
    );
  }
  return -1;
}

function originalToolIdentity(
  item: Extract<AiChatItem, { type: "tool" }>,
): boolean {
  return (
    item.id === item.toolId ||
    Boolean(
      item.agentBindingId &&
        item.id === `${item.agentBindingId}:${item.toolId}`,
    )
  );
}
