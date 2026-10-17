// SPDX-License-Identifier: Apache-2.0
import {
  FakeAgentRuntime,
  type FakeAgentTrace,
} from "../../../tests/ai/support/fake-runtime.ts";
import type { AgentRuntime } from "../../../src/lib/ai/core/runtime.ts";
export function createDemoRuntime({
  requireApproval,
  requireQuestion,
  trace,
  rejectApproval,
  rejectQuestion,
  preservePending,
}: {
  requireApproval: boolean;
  requireQuestion: boolean;
  trace: FakeAgentTrace;
  rejectApproval: boolean;
  rejectQuestion: boolean;
  preservePending: boolean;
}): AgentRuntime {
  const fake = new FakeAgentRuntime({
    requireApproval,
    requireQuestion,
    trace,
  });
  const start = fake.start.bind(fake);
  fake.start = async (request) => {
    const session = await start(request);
    if (rejectApproval)
      session.respondToApproval = async () => {
        throw new Error("Permission reply rejected");
      };
    if (rejectQuestion)
      session.respondToQuestion = async () => {
        throw new Error("Question reply rejected");
      };
    return session;
  };
  if (!preservePending) return fake;
  return {
    id: fake.id,
    capabilities: () => fake.capabilities(),
    supports: (request) => fake.supports(request),
    start: (request) => fake.start(request),
    async resume(sessionId) {
      return {
        id: sessionId,
        async *events() {},
        async send() {},
        async respondToApproval() {},
        async close() {},
      };
    },
  };
}
