import test from "node:test";
import assert from "node:assert/strict";
import { AcpAgentRuntime } from "../../src/lib/ai/runtimes/acp/runtime.ts";
import { acpFixture } from "../fixtures/ai/acp-transport.mjs";

test("Codex explicitly configures its user-approval mode before any prompt", async () => {
  const fixture = acpFixture();
  fixture.backend.client.targets = async () => [
    { id: "codex", label: "Codex" },
  ];
  const session = await new AcpAgentRuntime(fixture.backend).start({
    prompt: "",
    agent: "codex",
  });
  try {
    const configurations = fixture.calls.filter(
      ([kind, , , frame]) => kind === "submit" && frame.type === "configure",
    );
    assert.equal(configurations[0][3].mode, "read-only");
    assert.equal(
      fixture.calls.some(
        ([kind, , , frame]) => kind === "submit" && frame.type === "prompt",
      ),
      false,
    );
  } finally {
    await session.close();
  }
});
