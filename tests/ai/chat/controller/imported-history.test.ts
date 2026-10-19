import { expect, it, vi } from "vitest";
import { AiChatController } from "../../../../src/lib/ai/chat/chat-controller.svelte.ts";
import { FakeAgentRuntime } from "../../support/fake-runtime.ts";
import { ConversationRepository } from "../../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { prepareAiViewBootstrap } from "../../../../src/lib/ai/bootstrap/view-bootstrap.ts";
import { DEFAULT_AI_SETTINGS } from "../../../../src/lib/ai/settings/ai-settings.ts";
import type { AiViewHost } from "../../../../src/lib/ai/bootstrap/view-host.ts";
import type { CapturedSession } from "../../../../src/lib/ai/conversations/import-types.ts";

const capture: CapturedSession = {
  version: 1,
  source: {
    kind: "codex",
    profile: "codex-cli-0.156.1",
    sessionKey: "a".repeat(64),
    snapshotKey: "b".repeat(64),
  },
  createdAt: "2026-10-19T00:00:00.000Z",
  entries: [
    {
      id: "1",
      type: "message",
      role: "user",
      text: "Captured untrusted message",
      createdAt: "2026-10-19T00:00:00.000Z",
    },
  ],
};
it("cold imported bootstrap does not discover models, select a runtime or change settings", async () => {
  const repository = new ConversationRepository(new MemoryTranscriptStore());
  const { snapshot } = await repository.imports.save(capture, "");
  const runtime = new FakeAgentRuntime(),
    selectRuntime = vi.fn(),
    listModels = vi.fn(),
    updateSettings = vi.fn();
  const host = {
    getSettings: () => DEFAULT_AI_SETTINGS,
    fallbackRuntime: () => runtime,
    conversations: repository,
    selectRuntime,
    models: { listModels },
    updateSettings,
  } as unknown as AiViewHost;
  const result = await prepareAiViewBootstrap(host, snapshot.location, []);
  expect(result.importedSnapshot).toEqual(snapshot);
  expect(selectRuntime).not.toHaveBeenCalled();
  expect(listModels).not.toHaveBeenCalled();
  expect(updateSettings).not.toHaveBeenCalled();
  expect(runtime.sessions).toHaveLength(0);
});
it("in-place selection fences composer submissions before provider work and permits a new ordinary chat", async () => {
  const repository = new ConversationRepository(new MemoryTranscriptStore()),
    runtime = new FakeAgentRuntime();
  const { snapshot } = await repository.imports.save(capture, "Notes");
  const controller = new AiChatController(runtime, null, [], {
    repository,
    request: { agent: "codex" },
  });
  try {
    await controller.openConversation(snapshot.location);
    expect(controller.importedSnapshot).toEqual(snapshot);
    await expect(
      controller.submit("Run this captured session"),
    ).rejects.toThrow("read-only");
    expect(runtime.sessions).toHaveLength(0);
    expect((await repository.read(snapshot.location)).transcript).toEqual(
      snapshot.transcript,
    );
    await controller.newConversation({ scopeDir: "Notes" });
    expect(controller.importedSnapshot).toBeNull();
    await controller.submit("New explicit conversation");
    expect(runtime.sessions).toHaveLength(1);
  } finally {
    await controller.close();
  }
});
it("an un-restored imported location still refuses session launch", async () => {
  const repository = new ConversationRepository(new MemoryTranscriptStore()),
    runtime = new FakeAgentRuntime();
  const { snapshot } = await repository.imports.save(capture, "");
  const controller = new AiChatController(runtime, null, [], { repository });
  controller.location = snapshot.location;
  try {
    await expect(
      controller._prepareSession({ agent: "codex" }),
    ).rejects.toThrow("read-only");
    expect(runtime.sessions).toHaveLength(0);
  } finally {
    await controller.close();
  }
});
