import test from "node:test";
import assert from "node:assert/strict";
import { AcpAgentRuntime } from "../../src/lib/ai/runtimes/acp/runtime.ts";
import { acpFixture } from "../fixtures/ai/acp-transport.mjs";
import { captureQueuedMessage } from "../../src/lib/ai/chat/controller/queue-capture.ts";

test("Lapis profile launches retain exact targets and queued profile selectors", async () => {
  const f = acpFixture();
  f.backend.client.targets = async () =>
    ["local", "local:profile:a", "local:profile:b"].map((id) => ({
      id,
      label: id,
    }));
  const runtime = new AcpAgentRuntime(f.backend);
  for (const id of ["a", "b"]) {
    const request = {
      prompt: "hello",
      agent: "local",
      agentProfile: { providerProfileId: id },
    };
    const queued = captureQueuedMessage("hello", request);
    assert.equal(
      queued.selection.targets[0].agentProfile.providerProfileId,
      id,
    );
    assert.equal(await runtime.supports(request), true);
    const session = await runtime.start(request);
    assert.equal(
      f.calls.filter((call) => call[0] === "open").at(-1)[1].targetId,
      `local:profile:${id}`,
    );
    await session.close();
  }
  const missing = {
    prompt: "hello",
    agent: "local",
    agentProfile: { providerProfileId: "missing" },
  };
  assert.equal(await runtime.supports(missing), false);
  await assert.rejects(runtime.start(missing), /target unavailable/);
  assert.equal(f.calls.filter((call) => call[0] === "open").length, 2);
  assert.equal(await runtime.supports({ ...missing, restricted: true }), false);
});
