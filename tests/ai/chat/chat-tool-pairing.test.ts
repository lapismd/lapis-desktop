import { expect, it } from "vitest";
import type { AgentEvent } from "../../../src/lib/ai/core/events.ts";
import type { AiChatItem } from "../../../src/lib/ai/chat/chat-items.ts";
import { applyAgentEventToChatItems } from "../../../src/lib/ai/chat/chat-trace.ts";
import { eventIdentity } from "../../../src/lib/ai/chat/controller/event-identity.ts";

for (const first of ["provider", "application"] as const) {
  it(`retains one namespaced tool when ${first} starts before its paired stream`, () => {
    const provider: AgentEvent = {
      type: "tool.start",
      id: "provider-call",
      name: "acp_tool",
    };
    const application: AgentEvent = {
      type: "tool.start",
      id: "application-call",
      name: "read",
      server: "lapis-tools",
      input: { path: "Sample.md" },
    };
    const starts =
      first === "provider" ? [provider, application] : [application, provider];
    const ends: AgentEvent[] = [
      {
        type: "tool.end",
        id: "application-call",
        name: "read",
        server: "lapis-tools",
        output: "Captured note",
      },
      { type: "tool.end", id: "provider-call", name: "acp_tool" },
    ];
    let items: AiChatItem[] = [];
    let originalId: string | undefined;
    for (const event of [...starts, ...ends]) {
      items = applyAgentEventToChatItems(
        items,
        event,
        undefined,
        eventIdentity("binding"),
      ).map((item) => ({ ...item, agentBindingId: "binding" }));
      originalId ??= items[0]?.id;
      expect(items).toHaveLength(1);
      expect(items[0]?.id).toBe(originalId);
    }
    expect(items[0]).toMatchObject({
      type: "tool",
      name: "read",
      server: "lapis-tools",
      state: "completed",
      output: "Captured note",
    });
  });
}
