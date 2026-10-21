import { expect, it } from "vitest";
import { sessionAvatars } from "../../../src/lib/ai/presentation/session-avatars.ts";
import { agentAvatar } from "../../../src/lib/ai/presentation/agent-avatar.ts";
it("shows the chosen harness before sending and preserves named participant identities", () => {
  expect(sessionAvatars("cursor", [], [], [])[0]).toMatchObject({
    name: "Cursor",
    src: agentAvatar("cursor"),
  });
  const profiles = [
    {
      id: "a",
      agent: "local" as const,
      label: "Qwen",
      avatar: "data:image/png;base64,abc",
    },
    { id: "b", agent: "local" as const, label: "Offline" },
  ];
  const avatars = sessionAvatars("codex", ["a", "b", "a"], profiles, []);
  expect(avatars).toHaveLength(2);
  expect(avatars[0]).toMatchObject({ name: "Qwen", src: profiles[0]!.avatar });
  expect(avatars[1]).toMatchObject({ name: "Offline", src: "/lapis-logo.svg" });
});
