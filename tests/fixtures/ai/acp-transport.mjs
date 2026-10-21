// Deterministic public-contract transport for desktop orchestration acceptance.
import { createAcpClient } from "@lapismd/ai";
/**
 * @returns {{
 * calls: unknown[][],
 * onPrompt: ((id: string, requestId: string, request: Record<string, unknown>) => Promise<void>) | undefined,
 * unknown: boolean,
 * modeReady: boolean,
 * configuration?: unknown,
 * backend: import("../../../src/lib/ai/runtimes/acp/runtime.ts").AcpRuntimeBackend,
 * emit(id: string, type: string, requestId: string, extra?: Record<string, unknown>): void
 * }}
 */
export function acpFixture() {
  const sessions = new Map(),
    calls = [];
  let listener = 0;
  const f = { calls, onPrompt: undefined, unknown: false, modeReady: true };
  const transport = {
    async targets() {
      return [{ id: "agent", label: "Agent" }];
    },
    async list() {
      return [...sessions.values()].map((s) => s.info);
    },
    async open(options) {
      calls.push(["open", options]);
      const id = `worker-${sessions.size}`;
      const info = {
        sessionId: id,
        requestId: options.requestId,
        targetId: options.targetId,
        facts: {
          version: 3,
          type: "opened",
          requestId: "native-open",
          sessionId: id,
          adapterSessionId: `provider-${id}`,
        },
      };
      sessions.set(id, { info, sequence: 0, acknowledged: 0 });
      return info;
    },
    async submit(id, requestId, request) {
      calls.push(["submit", id, requestId, request]);
      if (request.type === "configure")
        f.emit(id, "configured", requestId, {
          modeReady: f.modeReady,
          configuration: f.configuration ?? {
            mode: { status: "applied" },
            model: { status: "applied" },
            effort: { status: "applied" },
          },
        });
      if (request.type === "prompt") {
        if (f.unknown) throw Error("lost invoke reply");
        if (f.onPrompt) await f.onPrompt(id, requestId, request);
        else
          f.emit(id, "record", requestId, {
            record: { status: "completed", stopReason: "end_turn" },
          });
      }
      if (request.type === "permission" || request.type === "cancel")
        f.emit(id, "ack", requestId);
    },
    async attach(id, after, receive) {
      const state = sessions.get(id);
      state.receive = receive;
      state.token = `subscription-${listener++}`;
      calls.push(["attach", id, after]);
      return state.token;
    },
    async snapshot(id) {
      const s = sessions.get(id);
      return {
        events: [],
        sequence: s.sequence,
        acknowledged: s.acknowledged,
        closed: false,
        failure: null,
        unresolvedRequests: [],
        cleanupFailed: false,
      };
    },
    async ack(id, token, sequence) {
      sessions.get(id).acknowledged = sequence;
    },
    async detach(id) {
      calls.push(["detach", id]);
      sessions.get(id).receive = undefined;
    },
    async close(id) {
      calls.push(["close", id]);
      sessions.delete(id);
    },
  };
  f.emit = (id, type, requestId, extra = {}) => {
    const s = sessions.get(id);
    const sequence = ++s.sequence;
    const frame = { version: 3, type, requestId, sessionId: id, ...extra };
    s.receive?.({
      sessionId: id,
      subscriptionId: s.token,
      snapshot: {
        events: [{ sequence, frame }],
        sequence,
        acknowledged: s.acknowledged,
        closed: false,
        failure: null,
        unresolvedRequests: [],
        cleanupFailed: false,
      },
    });
  };
  f.backend = {
    client: createAcpClient(transport),
    close: async (id) => transport.close(id),
  };
  return f;
}
export async function until(predicate) {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline)
      throw new Error("Expected native dispatch did not arrive");
    await new Promise((resolve) => setTimeout(resolve, 2));
  }
}
