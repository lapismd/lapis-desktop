import { expect, it } from "vitest";
import { AiSettingsStore } from "../../../src/lib/ai/settings/settings-store.ts";
import { validateAgentParticipants } from "../../../src/lib/ai/settings/participants.ts";
import { captureQueuedMessage } from "../../../src/lib/ai/chat/controller/queue-capture.ts";
import { queuedRequest } from "../../../src/lib/ai/chat/panel/queue-routing.ts";
import { recipientFromOption } from "../../../src/lib/ai/conversations/recipients.ts";
import { FakeAgentRuntime } from "../support/fake-runtime.ts";

it("restores custom avatar and runtime defaults independently of saved recipient identity", async () => {
  let saved: Record<string, unknown> | undefined;
  const store = new AiSettingsStore(async (value) => {
    saved = structuredClone(value);
  });
  const profile = {
    id: "reviewer",
    label: "Reviewer",
    agent: "codex" as const,
    model: "review-model",
    thinking: "high" as const,
    avatar: "https://example.test/reviewer.png",
    avatarBackground: "#6e56cf",
  };
  await store.update({ agentParticipants: [profile] });
  const cold = new AiSettingsStore(async () => {
    throw new Error("Restore cannot write");
  });
  cold.hydrate(saved);
  expect(cold.get().agentParticipants).toEqual([profile]);
  expect(Object.keys(recipientFromOption(profile)).sort()).toEqual([
    "id",
    "label",
    "token",
  ]);
  expect(
    validateAgentParticipants([
      { ...profile, avatar: "", avatarBackground: undefined },
    ])?.[0],
  ).not.toHaveProperty("avatar");
});

it.each([
  { avatar: "file:///Users/example/private.png" },
  { avatar: "javascript:alert(1)" },
  { avatar: "https://user:secret@example.test/avatar.png" },
  { avatar: "data:text/html,<script></script>" },
  { avatar: `data:image/png;base64,${"A".repeat(2 * 1024 * 1024)}` },
  { avatarBackground: "red; color: white" },
  { model: "bad\nmodel" },
  { thinking: "unbounded" },
])(
  "refuses invalid profile presentation/default fields before persistence: %j",
  (fields) => {
    expect(() =>
      validateAgentParticipants([
        { id: "reviewer", label: "Reviewer", agent: "codex", ...fields },
      ]),
    ).toThrow();
  },
);

it("freezes each recipient's model and effort through queue capture and cold routing", () => {
  const profiles = [
    {
      id: "reviewer",
      label: "Reviewer",
      agent: "codex" as const,
      model: "review-model",
      thinking: "high" as const,
    },
    {
      id: "writer",
      label: "Writer",
      agent: "codex" as const,
      model: "write-model",
      thinking: "low" as const,
    },
  ];
  const captured = captureQueuedMessage("Review then write", {
    recipients: profiles.map(recipientFromOption),
    agent: "codex",
    thinking: "medium",
    deliveryTargets: profiles.map((p) => ({
      recipient: recipientFromOption(p),
      request: {
        agent: p.agent,
        model: { provider: p.agent, model: p.model },
        thinking: p.thinking,
      },
    })),
  });
  const runtime = new FakeAgentRuntime();
  const cold = JSON.parse(JSON.stringify(captured));
  const changedProfiles = profiles.map((p) => ({
    ...p,
    model: "new-model",
    thinking: "off" as const,
  }));
  expect(
    queuedRequest(cold, { runtime }, changedProfiles).deliveryTargets?.map(
      (t) => t.request,
    ),
  ).toEqual([
    {
      agent: "codex",
      model: { provider: "codex", model: "review-model" },
      thinking: "high",
    },
    {
      agent: "codex",
      model: { provider: "codex", model: "write-model" },
      thinking: "low",
    },
  ]);
  for (const target of cold.selection.targets) delete target.thinking;
  expect(
    queuedRequest(cold, { runtime }, profiles).deliveryTargets?.map(
      (t) => t.request.thinking,
    ),
  ).toEqual(["medium", "medium"]);
});
