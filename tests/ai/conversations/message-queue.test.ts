import { expect, it, vi } from "vitest";
import { ConversationRepository } from "../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { recipientFromOption } from "../../../src/lib/ai/conversations/recipients.ts";
const recipient = recipientFromOption({
  id: "codex",
  label: "Codex",
  agent: "codex",
});
const capture = (text = "Queued follow-up") => ({
  version: 1 as const,
  id: crypto.randomUUID(),
  state: "queued" as const,
  user: {
    schemaVersion: 3 as const,
    id: crypto.randomUUID(),
    type: "message" as const,
    role: "user" as const,
    text,
    recipients: [recipient],
    createdAt: new Date().toISOString(),
  },
  selection: {
    targets: [{ id: recipient.id, agent: "codex" as const }],
    runtime: "acp" as const,
    attachments: [],
  },
});
async function fixture() {
  const store = new MemoryTranscriptStore();
  const repo = new ConversationRepository(store);
  const { location } = await repo.create({ scopeDir: "Notes" });
  return { repo, store, location };
}
it("persists a bounded queue without publishing authored prompts to agent context", async () => {
  const { repo, location } = await fixture(),
    q = capture();
  await repo.messages.enqueue(location, q, "owner");
  const s = await repo.read(location);
  expect(s.metadata.queuedMessages).toEqual([q]);
  expect(s.transcript).toEqual([]);
  await expect(repo.messages.acquire(location, "other")).rejects.toThrow(
    /owner/i,
  );
  repo.messages.release(location, "owner");
  expect(JSON.stringify(await repo.read(location))).toBe(JSON.stringify(s));
});
it("cancels only the queued item and keeps its exact authored capture", async () => {
  const { repo, location } = await fixture(),
    a = capture("Cancel me"),
    b = capture("Keep me");
  await repo.messages.enqueue(location, a, "owner");
  await repo.messages.enqueue(location, b, "owner");
  await repo.messages.cancel(location, a.id);
  const s = await repo.read(location);
  expect(s.metadata.queuedMessages).toEqual([b]);
  expect(s.transcript).toEqual([
    expect.objectContaining({
      type: "queue.outcome",
      outcome: "cancelled",
      queued: a,
    }),
  ]);
});
it("rejects queue overflow and execution-authority fields before changing saved state", async () => {
  const { repo, location } = await fixture();
  for (let i = 0; i < 16; i++)
    await repo.messages.enqueue(location, capture(), "owner");
  const before = JSON.stringify(await repo.read(location));
  await expect(
    repo.messages.enqueue(location, capture(), "owner"),
  ).rejects.toThrow(/limit/i);
  expect(JSON.stringify(await repo.read(location))).toBe(before);
  const other = await fixture();
  const bad = {
    ...capture(),
    selection: { ...capture().selection, command: "shell" },
  };
  await expect(
    other.repo.messages.enqueue(other.location, bad, "owner"),
  ).rejects.toThrow(/unsupported/i);
});
it("retains a terminal cancellation receipt after metadata acknowledgement loss", async () => {
  const { repo, store, location } = await fixture(),
    q = capture();
  await repo.messages.enqueue(location, q, "owner");
  const write = store.writeMetadata.bind(store);
  let fail = true;
  vi.spyOn(store, "writeMetadata").mockImplementation(async (l, m) => {
    if (fail) {
      fail = false;
      throw new Error("lost acknowledgement");
    }
    await write(l, m);
  });
  await expect(repo.messages.cancel(location, q.id)).rejects.toThrow(
    "lost acknowledgement",
  );
  await repo.messages.cancel(location, q.id);
  const s = await repo.read(location);
  expect(s.metadata.queuedMessages).toEqual([]);
  expect(s.transcript).toHaveLength(1);
});
