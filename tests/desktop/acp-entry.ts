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

const client = createTauriAcpClient();
const transport = createTauriAcpTransport();
const sessions = new Map<string, AcpSessionClient>();
const received = new Map<string, SessionSnapshot[]>();
const failures: string[] = [];
function options(id: string, after = 0) {
  received.set(id, []);
  return {
    after,
    consume(value: SessionSnapshot) {
      received.get(id)!.push(value);
    },
    onFailure(error: Error) {
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
      const session = await client.reconnect(info, options(id, after));
      sessions.set(id, session);
    },
    send(id: string, requestId: string, request: SessionRequest) {
      return sessions.get(id)!.send(requestId, request);
    },
    async detach(id: string) {
      const session = sessions.get(id)!;
      await session.detach();
      const after = session.sequence;
      sessions.delete(id);
      return after;
    },
    async close(id: string) {
      await sessions.get(id)!.close();
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
    failures: () => failures,
    raw: transport,
  },
});
