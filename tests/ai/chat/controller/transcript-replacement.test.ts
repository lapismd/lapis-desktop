import { expect, it, vi } from "vitest";
import { AiChatController } from "../../../../src/lib/ai/chat/chat-controller.svelte.ts";
import { protectChatTranscript } from "../../../../src/lib/ai/chat/controller/transcript-protection.ts";
import { ConversationRepository } from "../../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { FakeAgentRuntime } from "../../support/fake-runtime.ts";
async function fixture() {
  const repository = new ConversationRepository(new MemoryTranscriptStore());
  const snapshot = await repository.create({ scopeDir: "Notes" });
  const runtime = new FakeAgentRuntime({ id: "acp" });
  const start = vi.spyOn(runtime, "start");
  const controller = new AiChatController(runtime, null, [], {
    repository,
    location: snapshot.location,
  });
  return {
    repository,
    snapshot,
    runtime,
    start,
    controller,
    participant: protectChatTranscript(controller),
  };
}
it("fences sends before yielding and drains an already queued transcript save", async () => {
  const f = await fixture();
  let done!: () => void;
  f.controller._persistQueue = new Promise<void>((resolve) => {
    done = resolve;
  });
  const protecting = f.participant.protect();
  expect(await f.controller.submit("must not run")).toBe(false);
  expect(f.start).not.toHaveBeenCalled();
  done();
  const release = await protecting;
  expect(f.controller._filesProtected).toBe(1);
  release();
  expect(f.controller._filesProtected).toBe(0);
  await f.controller.close();
});
it("refuses active or unsettled turns and releases the send fence", async () => {
  const f = await fixture();
  f.controller.busy = true;
  await expect(f.participant.protect()).rejects.toThrow(/active or unsettled/);
  expect(f.controller._filesProtected).toBe(0);
  f.controller.busy = false;
  f.controller._recoveredTurn = {
    version: 1,
    id: "unknown",
    userEntryId: "user",
    agentBindingId: "binding",
    startedAt: new Date().toISOString(),
  };
  await expect(f.participant.protect()).rejects.toThrow(/active or unsettled/);
  f.controller._recoveredTurn = undefined;
  await f.controller.close();
});
it("reloads restored pending intent as unknown without starting or replaying it", async () => {
  const f = await fixture();
  const release = await f.participant.protect();
  await f.repository.appendTranscript(f.snapshot.location, [
    {
      schemaVersion: 1,
      id: "restored-user",
      type: "message",
      role: "user",
      text: "preserved prompt",
      createdAt: new Date().toISOString(),
    },
  ]);
  await f.repository.turns.prepare(
    f.snapshot.location,
    {
      version: 1,
      id: "old-turn",
      userEntryId: "restored-user",
      agentBindingId: "old-binding",
      startedAt: new Date().toISOString(),
    },
    {
      schemaVersion: 1,
      id: "restored-user",
      type: "message",
      role: "user",
      text: "preserved prompt",
      createdAt: new Date().toISOString(),
    },
  );
  // Simulate a cold file-reader: the restored intent has no current process owner.
  const cold = new ConversationRepository(
    new MemoryTranscriptStore([await f.repository.read(f.snapshot.location)]),
  );
  const controller = new AiChatController(f.runtime, null, [], {
    repository: cold,
    location: f.snapshot.location,
  });
  await protectChatTranscript(controller).reload();
  expect(controller.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ type: "message", text: "preserved prompt" }),
      expect.objectContaining({ id: expect.stringContaining("turn-unknown:") }),
    ]),
  );
  expect(controller.queuedMessages.paused).toBe(true);
  expect(f.start).not.toHaveBeenCalled();
  release();
  await controller.close();
  await f.controller.close();
});
