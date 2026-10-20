import { expect, it, vi } from "vitest";
import { NativeLiveSession } from "../../../src/lib/ai/chat/native-live-session.ts";
import {
  managedTurnFixture,
  deferred,
} from "../conversations/managed-turn-fixture.ts";

async function fixture() {
  const f = await managedTurnFixture(1);
  const session = f.sessions[0]!;
  const live = new NativeLiveSession(
    f.turn.state.deliveries[0]!,
    session,
    () => true,
    () => {},
  );
  live.items = [
    {
      id: "exact-display-occurrence",
      type: "approval",
      status: "pending",
      request: {
        id: "native-permission",
        kind: "write",
        title: "Write note",
        options: [
          { id: "opaque-choice-v2", kind: "allow-once", label: "Allow once" },
        ],
      },
    },
  ];
  return { ...f, live, session };
}

it("forwards the advertised permission ID and choice only after explicit selection", async () => {
  const { live, session } = await fixture();
  await expect(
    live.respond("exact-display-occurrence", "allow-always"),
  ).rejects.toThrow(/Unknown approval option/);
  expect(session.respondToApproval).not.toHaveBeenCalled();
  await live.respond("exact-display-occurrence", "opaque-choice-v2");
  expect(session.respondToApproval).toHaveBeenCalledWith(
    "native-permission",
    "opaque-choice-v2",
  );
  expect(live.pending).toEqual([]);
});

it("retains a rejected or uncertain response and refuses changing the original decision", async () => {
  const { live, session } = await fixture();
  session.respondToApproval.mockRejectedValueOnce(new Error("Reply lost"));
  await expect(
    live.respond("exact-display-occurrence", "opaque-choice-v2"),
  ).rejects.toThrow(/Reply lost/);
  expect(live.pending).toHaveLength(1);
  expect(live.responding("exact-display-occurrence")).toBe(false);
  await expect(
    live.respond("exact-display-occurrence", "different-choice"),
  ).rejects.toThrow(/original interaction/);
  await live.respond("exact-display-occurrence", "opaque-choice-v2");
  expect(live.pending).toEqual([]);
});

it("does not mark a late acknowledgement on a stopped session", async () => {
  const { live, session, turn } = await fixture(),
    reply = deferred<void>();
  let active = true;
  const guarded = new NativeLiveSession(
    turn.state.deliveries[0]!,
    session,
    () => active,
    vi.fn(),
  );
  guarded.items = live.items;
  session.respondToApproval.mockImplementationOnce(async () => reply.promise);
  const response = guarded.respond(
    "exact-display-occurrence",
    "opaque-choice-v2",
  );
  active = false;
  reply.resolve();
  await response;
  expect(guarded.items[0]).toMatchObject({ status: "pending" });
  expect(guarded.pending).toEqual([]);
});
