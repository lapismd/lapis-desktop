import { expect, it } from "vitest";
import { mergeAiSettings } from "../../../src/lib/ai/settings/ai-settings.ts";
import { AiSettingsStore } from "../../../src/lib/ai/settings/settings-store.ts";
it("persists logical names separately from admitted target identity and recovers exact settings", async () => {
  let saved: Record<string, unknown> | undefined;
  const store = new AiSettingsStore(async (data) => {
    saved = structuredClone(data);
  });
  const agentParticipants = [
    { id: "reviewer", label: "Reviewer", agent: "codex" as const },
    { id: "writer", label: "Writer", agent: "codex" as const },
  ];
  await store.update({ agentParticipants });
  const cold = new AiSettingsStore(async () => {
    throw new Error("Read-only restore cannot write");
  });
  cold.hydrate(saved);
  expect(cold.get().agentParticipants).toEqual(agentParticipants);
});
it("rejects arbitrary executable routes and malformed logical identities without granting authority", () => {
  expect(() =>
    mergeAiSettings({
      agentParticipants: [
        { id: "reviewer", label: "Reviewer", agent: "shell" as any },
      ],
    }),
  ).toThrow();
  expect(() =>
    mergeAiSettings({
      agentParticipants: [
        {
          id: "reviewer",
          label: "Reviewer",
          agent: "codex",
          executable: "/tmp/agent",
        } as any,
      ],
    }),
  ).toThrow();
  expect(() =>
    mergeAiSettings({
      agentParticipants: [
        { id: "reviewer", label: "Reviewer", agent: "codex" },
        { id: "reviewer", label: "Another", agent: "codex" },
      ],
    }),
  ).toThrow();
});
