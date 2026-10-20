import { vi } from "vitest";
import type {
  AgentRequest,
  AgentSession,
} from "../../../src/lib/ai/core/runtime.ts";
import type { PreparedCanonicalCapture } from "../../../src/lib/ai/conversations/backend-port.ts";
import type { ManagedTurnRecipient } from "../../../src/lib/ai/conversations/managed-turn-types.ts";
import { ManagedConversationTurn } from "../../../src/lib/ai/conversations/managed-turn.ts";
import { nativeReaderPort } from "../../../catalog/support/ai/native/port.ts";
import { owner, uuid } from "../../../catalog/support/ai/native/facts.ts";
import { managedDispatchFixture } from "./managed-dispatch-fixture.ts";

export function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
export async function managedTurnFixture(
  count = 2,
  text = "Keep the authored text unchanged",
) {
  const native = nativeReaderPort("authored");
  const read = (await native.port.canonical.openRead(
    native.opened.handle,
    owner.threadId,
  ))!;
  const current = structuredClone(read);
  current.handle = uuid(999);
  current.selection = [77, 88, 255];
  const order: string[] = [];
  const dispatch = managedDispatchFixture(native.port, read.identity, order);
  const recipients: ManagedTurnRecipient[] = Array.from(
    { length: count },
    (_, index) => ({
      participant: {
        profileId: `agent-${index}`,
        label: `Agent ${index}`,
        preferredModel: null,
        preferredEffort: "low",
      },
      request: { agent: "codex", thinking: "low" },
    }),
  );
  const sessions = recipients.map(
    (_, index) =>
      ({
        id: `native-worker-${index}`,
        events: async function* () {},
        send: vi.fn(
          async (
            _text: string,
            _options?: Parameters<AgentSession["send"]>[1],
          ) => {
            order.push(`send:${index}`);
            dispatch.complete(index);
          },
        ),
        respondToApproval: vi.fn(async () => {}),
        cancel: vi.fn(async () => {}),
        close: vi.fn(async () => {}),
      }) satisfies AgentSession,
  );
  const append = vi
    .spyOn(native.port.authored, "appendCanonical")
    .mockImplementation(async (_handle, message) => {
      order.push("author");
      return {
        requestId: message.requestId,
        conversation: structuredClone(read.identity),
        messageId: "f".repeat(32),
        receipt: "opaque native proof",
      };
    });
  const status = vi
    .spyOn(native.port.authored, "canonicalStatus")
    .mockImplementation(async (_handle, requestId) => ({
      requestId,
      conversation: structuredClone(read.identity),
      messageId: "f".repeat(32),
      receipt: "original native proof",
    }));
  const refresh = vi
    .spyOn(native.port.canonical, "openRead")
    .mockImplementation(async () => {
      order.push("read-current");
      return structuredClone(current);
    });
  const prepare = vi
    .spyOn(native.port.managed, "prepareCanonical")
    .mockImplementation(async (_handle, input) => {
      order.push(`plan:${input.participant?.profileId}`);
      const targetId = uuid(500 + order.length);
      dispatch.reserve(input.requestId, targetId);
      return {
        requestId: input.requestId,
        conversation: structuredClone(input.conversation),
        targetId,
      };
    });
  const closeRead = vi.spyOn(native.port, "closeRead");
  let starts = 0;
  const launcher = {
    supports: vi.fn(async (_request: AgentRequest) => true),
    start: vi.fn(
      async (
        prepared: PreparedCanonicalCapture,
        _request: AgentRequest,
      ): Promise<AgentSession> => {
        order.push(`start:${starts}`);
        dispatch.bind(prepared.requestId, sessions[starts]!.id);
        return sessions[starts++]!;
      },
    ),
    prepareStop: vi.fn(async (_session: AgentSession) => {
      order.push("detach-stream");
    }),
    releaseStopped: vi.fn(async (session: AgentSession) => session.close()),
  };
  const turn = new ManagedConversationTurn(
    native.port,
    native.opened,
    launcher,
    read,
    text,
    recipients,
  );
  return {
    native,
    read,
    current,
    recipients,
    sessions,
    launcher,
    turn,
    append,
    status,
    refresh,
    prepare,
    closeRead,
    order,
    dispatch,
  };
}
