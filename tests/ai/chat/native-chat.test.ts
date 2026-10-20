import { expect, it, vi } from "vitest";
import { NativeConversationChat } from "../../../src/lib/ai/chat/native-chat.ts";
import {
  managedTurnFixture,
  deferred,
} from "../conversations/managed-turn-fixture.ts";

async function fixture() {
  const turn = await managedTurnFixture(1);
  const report = vi.fn();
  const reader = {
    state: { conversation: turn.read, reading: false },
    selectRoute: vi.fn(async () => {}),
    reconcile: vi.fn(
      async (
        _identity: unknown,
        _requests: readonly string[],
        accept: () => void,
      ) => {
        accept();
      },
    ),
  };
  const create = vi.fn(() => turn.turn);
  const chat = new NativeConversationChat(
    reader,
    turn.native.port,
    turn.native.opened.handle,
    create,
    () => [],
    report,
  );
  return { ...turn, reader, report, create, chat };
}

it("authors once, starts one worker and replaces live rows only after capture confirmation", async () => {
  const f = await fixture();
  f.sessions[0]!.events = async function* () {
    yield {
      type: "text",
      text: "Captured answer",
      messageId: "answer",
    } as const;
  };
  expect(
    await f.chat.submit("Keep the authored text unchanged", f.recipients),
  ).toBe(true);
  await vi.waitFor(() => expect(f.chat.state.busy).toBe(false));
  expect(f.append).toHaveBeenCalledOnce();
  expect(f.launcher.start).toHaveBeenCalledOnce();
  expect(f.sessions[0]!.send).toHaveBeenCalledOnce();
  expect(f.reader.reconcile).toHaveBeenCalledWith(
    f.read.identity,
    [f.turn.state.deliveries[0]!.id],
    expect.any(Function),
  );
  expect(f.chat.state.live).toEqual([]);
  expect(f.report).not.toHaveBeenCalled();
  await f.chat.close();
});

it("retains live output on failed reconciliation and Stop retries without another send", async () => {
  const f = await fixture();
  f.sessions[0]!.events = async function* () {
    yield {
      type: "text",
      text: "Retain this answer",
      messageId: "answer",
    } as const;
  };
  f.reader.reconcile.mockRejectedValueOnce(
    new Error("Capture not visible yet"),
  );
  await f.chat.submit("Keep the authored text unchanged", f.recipients);
  await vi.waitFor(() => expect(f.chat.state.blocked).toBe(true));
  expect(f.chat.state.live.length).toBeGreaterThan(0);
  await expect(f.chat.submit("Do not replay", f.recipients)).rejects.toThrow(
    /previous native turn/,
  );
  await f.chat.stop();
  expect(f.chat.state.blocked).toBe(false);
  expect(f.chat.state.live).toEqual([]);
  expect(f.sessions[0]!.send).toHaveBeenCalledOnce();
  await f.chat.close();
});

it("keeps an uncertain human write read-only during recovery and never starts its worker", async () => {
  const f = await fixture();
  f.append.mockRejectedValueOnce(new Error("Human write reply lost"));
  expect(
    await f.chat.submit("Keep the authored text unchanged", f.recipients),
  ).toBe(false);
  expect(f.chat.state.authorshipUnknown).toBe(true);
  expect(await f.chat.recoverAuthorship()).toBe(true);
  expect(f.chat.state.authorshipUnknown).toBe(false);
  expect(f.append).toHaveBeenCalledOnce();
  expect(f.launcher.start).not.toHaveBeenCalled();
  await f.chat.close();
});

it("Stop fences a pending startup and never dispatches the prompt", async () => {
  const f = await fixture(),
    gate = deferred<void>();
  const start = f.launcher.start.getMockImplementation()!;
  f.launcher.start.mockImplementation(async (...args) => {
    await gate.promise;
    return start(...args);
  });
  await f.chat.submit("Keep the authored text unchanged", f.recipients);
  await vi.waitFor(() => expect(f.launcher.start).toHaveBeenCalledOnce());
  const stopped = f.chat.stop();
  gate.resolve();
  await stopped;
  expect(f.sessions[0]!.send).not.toHaveBeenCalled();
  expect(f.launcher.releaseStopped).toHaveBeenCalled();
  await f.chat.close();
});
