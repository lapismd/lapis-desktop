import {
  createTauriAcpClient,
  createTauriAcpTransport,
} from "@lapismd/ai/tauri";
import type {
  AcpSessionClient,
  SessionInfo,
  SessionRequest,
  SessionSnapshot,
} from "@lapismd/ai";
import { sessionEventFrames } from "@lapismd/ai";

import { AcpAgentSession } from "../../src/lib/ai/runtimes/acp/session.ts";
import type { AgentEvent } from "../../src/lib/ai/core/events.ts";

const projections = new Map<
  string,
  { session: AcpAgentSession; events: AgentEvent[] }
>();
const client = createTauriAcpClient();
const transport = createTauriAcpTransport();
const sessions = new Map<string, AcpSessionClient>();
const received = new Map<string, SessionSnapshot[]>();
const failures: string[] = [];
function options(id: string, after = 0) {
  received.set(id, []);
  const projection = {
    session: new AcpAgentSession(),
    events: [] as AgentEvent[],
  };
  projections.set(id, projection);
  void (async () => {
    for await (const event of projection.session.events())
      projection.events.push(event);
  })();
  return {
    after,
    consume(value: SessionSnapshot) {
      projection.session.consume(value);
      received.get(id)!.push(value);
    },
    onFailure(error: Error) {
      projection.session.fail(error);
      failures.push(error.message);
    },
  };
}
Object.assign(globalThis, {
  __lapisAcpAcceptance: {
    targets: () => client.targets(),
    list: () => client.list(),
    async open(id: string) {
      const session = await client.open(
        { requestId: id, targetId: "compiled-fixture" },
        options(id),
      );
      sessions.set(id, session);
      return session.info;
    },
    async reconnect(id: string, info: SessionInfo, after: number) {
      await projections.get(id)?.session.close();
      const session = await client.reconnect(info, options(id, after));
      sessions.set(id, session);
    },
    send(id: string, requestId: string, request: SessionRequest) {
      return sessions.get(id)!.send(requestId, request);
    },
    async detach(id: string) {
      const session = sessions.get(id)!;
      await session.detach();
      await projections.get(id)?.session.close();
      const after = session.sequence;
      sessions.delete(id);
      return after;
    },
    async close(id: string) {
      await sessions.get(id)!.close();
      await projections.get(id)?.session.close();
      sessions.delete(id);
    },
    events(id: string) {
      return received.get(id) ?? [];
    },
    frames(id: string) {
      return (received.get(id) ?? []).flatMap((snapshot) =>
        snapshot.events.flatMap(sessionEventFrames),
      );
    },
    mapped: (id: string) => projections.get(id)?.events ?? [],
    failures: () => failures,
    raw: transport,
  },
});
