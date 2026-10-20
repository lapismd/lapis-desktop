import { expect, it } from "vitest";
import { validateAgentParticipants } from "../../../src/lib/ai/settings/participants.ts";
import { AiSettingsStore } from "../../../src/lib/ai/settings/settings-store.ts";
import { captureQueuedMessage } from "../../../src/lib/ai/chat/controller/queue-capture.ts";
import { queuedRequest } from "../../../src/lib/ai/chat/panel/queue-routing.ts";
import { recipientFromOption } from "../../../src/lib/ai/conversations/recipients.ts";
import { ConversationRepository } from "../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { executionModesFromSession } from "../../../src/lib/ai/core/agent-profile.ts";
import { FakeAgentRuntime } from "../support/fake-runtime.ts";

const profile = {
  id: "reviewer",
  label: "Reviewer",
  agent: "codex" as const,
  description: "Reviews notes",
  instructions: "Keep examples",
  executionMode: "reviewed",
};
it("cold profile settings retain context and permissions without changing mention identity", async () => {
  let data: unknown;
  const settings = new AiSettingsStore(async (value) => {
    data = value;
  });
  await settings.update({ agentParticipants: [profile] });
  const restored = new AiSettingsStore(async () => {
    throw new Error("Cannot write while loading");
  });
  restored.hydrate(data);
  expect(restored.get().agentParticipants).toEqual([profile]);
  expect(Object.keys(recipientFromOption(profile)).sort()).toEqual([
    "id",
    "label",
    "token",
  ]);
});
it.each([
  { description: "a".repeat(281) },
  { instructions: "é".repeat(16385) },
  { instructions: "unsafe\0text" },
  { executionMode: "bad\nmode" },
])("refuses invalid agent context before saving: %j", (fields) => {
  expect(() =>
    validateAgentParticipants([{ ...profile, ...fields }]),
  ).toThrow();
});
it("queue captures preserve instructions and permission mode through profile changes and cold reload", () => {
  const recipient = recipientFromOption(profile);
  const captured = captureQueuedMessage("Please review", {
    agent: "codex",
    recipients: [recipient],
    agentProfile: { name: profile.label, instructions: profile.instructions },
    executionMode: profile.executionMode,
  });
  const changed = {
    ...profile,
    instructions: "Changed",
    executionMode: "unreviewed",
  };
  const request = queuedRequest(
    JSON.parse(JSON.stringify(captured)),
    { runtime: new FakeAgentRuntime() },
    [changed],
  );
  expect(request.agentProfile?.instructions).toBe("Keep examples");
  expect(request.executionMode).toBe("reviewed");
});
it("conversation overrides survive cold reload, remain participant-local and clear back to inheritance", async () => {
  const store = new MemoryTranscriptStore();
  const repository = new ConversationRepository(store);
  const { location } = await repository.create({ scopeDir: "Notes" });
  await repository.permissions.write(location, "reviewer", "reviewed");
  await repository.permissions.write(location, "writer", "edit");
  const cold = new ConversationRepository(store);
  expect((await cold.read(location)).metadata.executionModes).toEqual({
    reviewer: "reviewed",
    writer: "edit",
  });
  await cold.permissions.write(location, "reviewer");
  expect((await cold.read(location)).metadata.executionModes).toEqual({
    writer: "edit",
  });
  expect((await cold.read(location)).transcript).toEqual([]);
});
it("only negotiated execution modes are selectable, excluding collaboration modes and inconsistent legacy modes", () => {
  const configOptions = [
    {
      id: "execution",
      category: "mode",
      options: [
        { value: "ask", name: "Ask before tools" },
        { value: "edit", name: "Edit" },
      ],
    },
    {
      id: "collaboration",
      category: "collaboration_mode",
      options: [{ value: "plan", name: "Plan" }],
    },
  ];
  expect(
    executionModesFromSession({
      configOptions,
      modes: {
        availableModes: [{ id: "ask", description: "Reviewed actions" }],
      },
    }),
  ).toEqual([
    { id: "ask", name: "Ask before tools", description: "Reviewed actions" },
  ]);
  expect(
    executionModesFromSession({ modes: { availableModes: [{ id: "ask" }] } }),
  ).toEqual([]);
});

it("refuses changing permissions while a turn is active or its outcome remains unsettled", async () => {
  const repo = new ConversationRepository(new MemoryTranscriptStore());
  const { location } = await repo.create({ scopeDir: "Notes" });
  const startedAt = "2026-10-20T20:00:00.000Z";
  await repo.turns.prepare(
    location,
    {
      version: 1,
      id: "one",
      userEntryId: "user-one",
      agentBindingId: "local",
      startedAt,
    },
    {
      schemaVersion: 3,
      id: "user-one",
      type: "message",
      role: "user",
      text: "Review",
      createdAt: startedAt,
    },
  );
  await expect(
    repo.permissions.write(location, "reviewer", "edit"),
  ).rejects.toThrow(/settle/);
  await repo.turns.finish(location, "one", false);
  await expect(
    repo.permissions.write(location, "reviewer", "edit"),
  ).rejects.toThrow(/settle/);
  expect((await repo.read(location)).metadata.executionModes).toBeUndefined();
});
