import type {
  AgentRuntime,
  AgentSession,
} from "../../../src/lib/ai/core/runtime.ts";
import type { AiChatController } from "../../../src/lib/ai/chat/chat-controller.svelte.ts";
import { FakeAgentRuntime } from "./fake-runtime.ts";
import { AsyncEventQueue } from "../../../src/lib/ai/core/event-queue.ts";
import type { AgentEvent } from "../../../src/lib/ai/core/events.ts";
export function pendingApprovals(controller: AiChatController) {
  return controller.items.filter(
    (
      item,
    ): item is Extract<
      (typeof controller.items)[number],
      { type: "approval" }
    > => item.type === "approval" && item.status === "pending",
  );
}

export function createResumableRuntime(id: string): {
  runtime: AgentRuntime;
  starts: () => number;
  resumes: () => number;
} {
  let startCount = 0;
  let resumeCount = 0;
  const capabilities = new FakeAgentRuntime().capabilities();
  const session = (sessionId: string): AgentSession => {
    // Like ACP, retain the stream until close and confirm only a submitted turn.
    const events = new AsyncEventQueue<AgentEvent>();
    return {
      id: sessionId,
      events: () => events,
      async send() {
        events.push({ type: "completed" });
      },
      async respondToApproval() {},
      async close() {
        events.close();
      },
    };
  };
  return {
    runtime: {
      id,
      capabilities: () => capabilities,
      async supports() {
        return true;
      },
      async start() {
        startCount += 1;
        return session(`${id}-${startCount}`);
      },
      async resume(sessionId) {
        resumeCount += 1;
        return session(sessionId);
      },
    },
    starts: () => startCount,
    resumes: () => resumeCount,
  };
}
