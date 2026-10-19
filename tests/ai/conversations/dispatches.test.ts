import { expect, it, vi } from "vitest";
import { ConversationRepository } from "../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { recipientFromOption } from "../../../src/lib/ai/conversations/recipients.ts";
import {
  validateDispatchIntent,
  type DispatchIntent,
} from "../../../src/lib/ai/conversations/dispatch-intent.ts";
import type { TranscriptEntry } from "../../../src/lib/ai/conversations/types.ts";
const recipients = ["reviewer", "writer"].map((id) =>
  recipientFromOption({ id, label: id, agent: "codex" }),
);
async function fixture() {
  const store = new MemoryTranscriptStore(),
    repo = new ConversationRepository(store);
  const snapshot = await repo.create({ scopeDir: "Notes" }),
    location = snapshot.location;
  const user: Extract<TranscriptEntry, { type: "message" }> = {
    schemaVersion: 3,
    id: "one-authored-message",
    type: "message",
    role: "user",
    text: "Review this note",
    recipients,
    createdAt: "2026-10-19T00:00:00.000Z",
  };
  const intent: DispatchIntent = {
    version: 1,
    id: "one-explicit-send",
    userEntryId: user.id,
    startedAt: user.createdAt,
    deliveries: recipients.map((recipient, i) => ({
      id: `delivery-${i}`,
      recipient,
      state: "pending",
    })),
  };
  return { store, repo, location, user, intent };
}
it("claims one durable parent and refuses concurrent ordinary or duplicate dispatch preparation", async () => {
  const { repo, location, user, intent } = await fixture();
  await repo.dispatches.begin(location, user, intent);
  await expect(repo.dispatches.begin(location, user, intent)).rejects.toThrow(
    /active or unconfirmed/,
  );
  await expect(
    repo.turns.prepare(
      location,
      {
        version: 1,
        id: "another-turn",
        userEntryId: "another-message",
        agentBindingId: "another-binding",
        startedAt: user.createdAt,
      },
      { ...user, id: "another-message" },
    ),
  ).rejects.toThrow(/active or unconfirmed/);
  expect(
    (await repo.read(location)).transcript.filter((e) => e.type === "message"),
  ).toHaveLength(1);
});
it("retains known terminal evidence after a lost metadata acknowledgement without replay", async () => {
  const { store, repo, location, user, intent } = await fixture();
  await repo.dispatches.begin(location, user, intent);
  await repo.dispatches.start(
    location,
    intent.id,
    "delivery-0",
    "binding-reviewer",
  );
  const write = store.writeMetadata.bind(store);
  let fail = true;
  vi.spyOn(store, "writeMetadata").mockImplementation(async (l, m) => {
    if (fail && m.pendingDispatch?.deliveries[0]?.state === "completed") {
      fail = false;
      throw new Error("Lost metadata acknowledgement");
    }
    await write(l, m);
  });
  await expect(
    repo.dispatches.finish(location, intent.id, "delivery-0", "completed"),
  ).rejects.toThrow(/Lost metadata/);
  await repo.dispatches.abandon(location, intent.id, "not_sent");
  const saved = await repo.read(location);
  expect(saved.metadata.pendingDispatch).toBeUndefined();
  expect(
    saved.transcript
      .filter(
        (e) => e.type === "agent.delivery" && e.delivery.id === "delivery-0",
      )
      .map((e) => e.type === "agent.delivery" && e.delivery.state),
  ).toEqual(["pending", "started", "completed"]);
  expect(saved.transcript).toContainEqual(
    expect.objectContaining({
      type: "agent.delivery",
      delivery: expect.objectContaining({
        id: "delivery-1",
        state: "not_sent",
      }),
    }),
  );
});
it("cold recovery is read-only and explicit continuation preserves the original outcomes", async () => {
  const { store, repo, location, user, intent } = await fixture();
  await repo.dispatches.begin(location, user, intent);
  await repo.dispatches.start(
    location,
    intent.id,
    "delivery-0",
    "binding-reviewer",
  );
  const before = JSON.stringify(await repo.read(location));
  const cold = new ConversationRepository(store);
  expect(cold.dispatches.recovery(await cold.read(location))).toMatchObject({
    id: intent.id,
  });
  expect(JSON.stringify(await cold.read(location))).toBe(before);
  await expect(
    cold.turns.prepare(
      location,
      {
        version: 1,
        id: "new-turn",
        userEntryId: "new-message",
        agentBindingId: "new-binding",
        startedAt: user.createdAt,
      },
      { ...user, id: "new-message" },
    ),
  ).rejects.toThrow(/unconfirmed/);
  await cold.turns.prepare(
    location,
    {
      version: 1,
      id: "new-turn",
      userEntryId: "new-message",
      agentBindingId: "new-binding",
      startedAt: user.createdAt,
    },
    { ...user, id: "new-message" },
    undefined,
    intent.id,
  );
  const saved = await cold.read(location);
  expect(saved.metadata.pendingDispatch).toBeUndefined();
  expect(
    saved.transcript
      .filter((e) => e.type === "agent.delivery")
      .map((e) => e.type === "agent.delivery" && e.delivery.state),
  ).toEqual(["pending", "pending", "started", "unknown", "not_sent"]);
});
it("rejects duplicate recipient identities, duplicated delivery IDs and execution fields in saved plans", async () => {
  const { intent } = await fixture();
  expect(() =>
    validateDispatchIntent({
      ...intent,
      deliveries: [intent.deliveries[0], intent.deliveries[0]],
    }),
  ).toThrow();
  expect(() =>
    validateDispatchIntent({ ...intent, executable: "/not-authority" }),
  ).toThrow();
  expect(() =>
    validateDispatchIntent({
      ...intent,
      deliveries: [
        { ...intent.deliveries[0], executable: "/not-authority" },
        intent.deliveries[1],
      ],
    }),
  ).toThrow();
});

it("failed abandonment releases the local owner while retaining uncertain durable state", async () => {
  const { store, repo, location, user, intent } = await fixture();
  await repo.dispatches.begin(location, user, intent);
  await repo.dispatches.start(
    location,
    intent.id,
    "delivery-0",
    "binding-reviewer",
  );
  const append = store.appendTranscriptEntries.bind(store);
  let fail = true;
  vi.spyOn(store, "appendTranscriptEntries").mockImplementation(
    async (l, entries) => {
      if (
        fail &&
        entries.some(
          (e) => e.type === "agent.delivery" && e.delivery.state === "unknown",
        )
      ) {
        fail = false;
        throw new Error("Unknown receipt unavailable");
      }
      await append(l, entries);
    },
  );
  await expect(
    repo.dispatches.abandon(location, intent.id, "cancelled"),
  ).rejects.toThrow(/Unknown receipt/);
  expect(repo.dispatches.isActive(location, intent.id)).toBe(false);
  expect(repo.dispatches.recovery(await repo.read(location))).toMatchObject({
    id: intent.id,
  });
});
it("cancellation racing a completed recipient preserves its known result", async () => {
  const { repo, location, user, intent } = await fixture();
  await repo.dispatches.begin(location, user, intent);
  await repo.dispatches.start(
    location,
    intent.id,
    "delivery-0",
    "binding-reviewer",
  );
  const finished = repo.dispatches.finish(
    location,
    intent.id,
    "delivery-0",
    "completed",
  );
  const cancelled = repo.dispatches.abandon(location, intent.id, "cancelled");
  await Promise.all([finished, cancelled]);
  const saved = await repo.read(location);
  expect(saved.transcript).not.toContainEqual(
    expect.objectContaining({
      type: "agent.delivery",
      delivery: expect.objectContaining({ id: "delivery-0", state: "unknown" }),
    }),
  );
});
it("completed delivery identities cannot be reused by another parent", async () => {
  const { repo, location, user, intent } = await fixture();
  await repo.dispatches.begin(location, user, intent);
  await repo.dispatches.abandon(location, intent.id, "not_sent");
  await expect(
    repo.dispatches.begin(
      location,
      { ...user, id: "second-user" },
      { ...intent, id: "second-parent", userEntryId: "second-user" },
    ),
  ).rejects.toThrow(/identit|existing/i);
  expect(
    (await repo.read(location)).transcript.filter((e) => e.type === "message"),
  ).toHaveLength(1);
});
