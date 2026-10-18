import { expect, it, vi } from "vitest";
import { AiChatController } from "../../../../src/lib/ai/chat/chat-controller.svelte.ts";
import { AcpAgentRuntime } from "../../../../src/lib/ai/runtimes/acp/runtime.ts";
import type { SkillRegistry } from "../../../../src/lib/ai/skills/registry.ts";
import { acpFixture } from "../../../fixtures/ai/acp-transport.mjs";

it("plain chat works through ACP when the ordinary controller discovers app skills", async () => {
  const fixture = acpFixture();
  const runtime = new AcpAgentRuntime(fixture.backend);
  const start = vi.spyOn(runtime, "start");
  const snapshot = {
    id: "discovered",
    createdAt: new Date().toISOString(),
    skills: [
      {
        skillId: "notes",
        name: "notes",
        description: "Read notes",
        version: "1",
        userInvocable: true,
        modelInvocable: true,
      },
    ],
  };
  const skills = {
    snapshot: vi.fn(async () => snapshot),
  } as unknown as SkillRegistry;
  const controller = new AiChatController(runtime, null, [], {
    request: { agent: "agent" },
    skills,
    readVaultText: async () => "Synthetic attached note content",
  });
  try {
    await controller.submit("Synthetic plain chat", {
      metadata: { attachments: ["Note.md"] },
    });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    expect(skills.snapshot).toHaveBeenCalled();
    expect(
      fixture.calls.filter(
        (call) => call[0] === "submit" && call[3].type === "prompt",
      ),
    ).toHaveLength(1);
    const prompt = fixture.calls.find(
      (call) => call[0] === "submit" && call[3].type === "prompt",
    )![3];
    expect(prompt.text).toBe("Synthetic plain chat");
    expect(prompt.context).toContain("Synthetic attached note content");
    expect(start.mock.calls[0]![0].skillSnapshot).toBeUndefined();
    expect(
      start.mock.calls[0]![0].metadata?.availableSkillsManifest,
    ).toBeUndefined();
    await expect(
      runtime.start({ prompt: "", skillSnapshot: snapshot }),
    ).rejects.toThrow(/unsupported/);
  } finally {
    await controller.close();
  }
});
