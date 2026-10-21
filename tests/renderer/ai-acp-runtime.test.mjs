import test from "node:test";
import assert from "node:assert/strict";
import { AcpAgentRuntime } from "../../src/lib/ai/runtimes/acp/runtime.ts";
import { acpFixture, until } from "../fixtures/ai/acp-transport.mjs";
const request = { prompt: "", agent: "agent" };
const memory = {
  kind: "memory-recall",
  id: "memory",
  content: "Recalled facts",
  metadata: { memoryId: "one", revision: 1, scope: "workspace" },
};
const submits = (f) => f.calls.filter(([call]) => call === "submit");

test("provider-default reasoning sends no effort override while explicit levels remain exact", async () => {
  for (const thinking of ["default", "high"]) {
    const f = acpFixture();
    const session = await new AcpAgentRuntime(f.backend).start({
      ...request,
      thinking,
    });
    assert.equal(
      submits(f)[0][3].effort,
      thinking === "default" ? undefined : "high",
    );
    await session.close();
  }
});

test("OpenCode starts with its advertised plan mode and preserves an explicit build choice", async () => {
  for (const executionMode of [undefined, "build"]) {
    const f = acpFixture();
    f.backend.client.targets = async () => [
      { id: "opencode", label: "OpenCode" },
    ];
    const session = await new AcpAgentRuntime(f.backend).start({
      ...request,
      agent: "opencode",
      executionMode,
    });
    assert.equal(submits(f)[0][3].mode, executionMode ?? "plan");
    assert.equal(
      submits(f).some((call) => call[3].type === "prompt"),
      false,
    );
    await session.close();
  }
});

test("ACP start attaches before configuring and never sends the initial prompt implicitly", async () => {
  const f = acpFixture();
  const runtime = new AcpAgentRuntime(f.backend);
  const session = await runtime.start({
    ...request,
    prompt: "Do not auto submit",
  });
  assert.deepEqual(
    f.calls.slice(0, 3).map((call) => call[0]),
    ["open", "attach", "submit"],
  );
  assert.equal(submits(f)[0][3].type, "configure");
  assert.equal(submits(f)[0][3].mode, "ask");
  assert.equal(
    submits(f).some((call) => call[3].type === "prompt"),
    false,
  );
  await session.close();
});

test("authored text and deferred memory context reach the real public client separately", async () => {
  const f = acpFixture();
  const session = await new AcpAgentRuntime(f.backend).start(request);
  await session.send("  authored café\n", {
    prepareContext: async () => [memory],
  });
  const sent = submits(f).find((call) => call[3].type === "prompt")[3];
  assert.equal(sent.text, "  authored café\n");
  assert.ok(sent.context.includes("Recalled facts"));
  assert.ok(!sent.text.includes("Recalled facts"));
  await session.close();
});

test("one active turn includes asynchronous preparation; cancelling it prevents dispatch", async () => {
  const f = acpFixture();
  const session = await new AcpAgentRuntime(f.backend).start(request);
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const first = session.send("first", {
    prepareContext: async () => {
      await gate;
      return [memory];
    },
  });
  const cancelled = assert.rejects(first, { name: "AbortError" });
  await assert.rejects(session.send("overlap"), /busy/);
  await session.cancel();
  release();
  await cancelled;
  assert.equal(
    submits(f).filter((call) => call[3].type === "prompt").length,
    0,
  );
  await session.close();
});

test("exact provider choices and explicit approval cancellation never use semantic defaults", async () => {
  const f = acpFixture();
  let turn;
  f.onPrompt = async (id, requestId) => {
    turn = { id, requestId };
    f.emit(id, "permission", requestId, {
      permissionId: "live",
      request: {
        options: [
          { optionId: "provider:custom", name: "Custom", kind: "future_kind" },
        ],
      },
    });
  };
  const session = await new AcpAgentRuntime(f.backend).start(request);
  const sending = session.send("Question");
  await until(() => turn);
  const iterator = session.events()[Symbol.asyncIterator]();
  let event;
  do {
    event = (await iterator.next()).value;
  } while (event.type !== "permission.request");
  assert.equal(event.request.options[0].kind, "unknown");
  await assert.rejects(
    session.respondToApproval("live", "allow-once"),
    /Unknown approval option/,
  );
  await session.respondToApproval("live", "provider:custom");
  const choice = submits(f).find((call) => call[3].type === "permission")[3];
  assert.equal(choice.option_id, "provider:custom");
  await assert.rejects(
    session.respondToApproval("live", "provider:custom"),
    /Unknown approval request/,
  );
  f.emit(turn.id, "permission", turn.requestId, {
    permissionId: "cancel-me",
    request: { options: [] },
  });
  await until(() => session.pendingApprovals.includes("cancel-me"));
  await session.cancelApproval("cancel-me");
  assert.equal(
    submits(f)
      .filter((call) => call[3].type === "permission")
      .at(-1)[3].option_id,
    null,
  );
  f.emit(turn.id, "record", turn.requestId, {
    record: { status: "completed" },
  });
  await sending;
  await session.close();
});

test("unknown submission is explicit and cannot automatically replay on the same session", async () => {
  const f = acpFixture();
  f.unknown = true;
  const session = await new AcpAgentRuntime(f.backend).start(request);
  await assert.rejects(session.send("once"), {
    code: "submission_unknown",
    outcome: "unknown",
  });
  await assert.rejects(session.send("again"), /unavailable/);
  assert.equal(
    submits(f).filter((call) => call[3].type === "prompt").length,
    1,
  );
  await session.close();
});

test("unusable terminal results block further turns instead of fabricating success", async () => {
  const f = acpFixture();
  f.onPrompt = async (id, requestId) =>
    f.emit(id, "record", requestId, {
      record: { status: "outcome_unknown", error: "coverage_lost" },
      sessionUsable: false,
    });
  const session = await new AcpAgentRuntime(f.backend).start(request);
  await assert.rejects(session.send("once"), {
    message: "coverage_lost",
    outcome: "unknown",
  });
  await assert.rejects(session.send("again"), /unavailable/);
  await session.close();
});

test("detach preserves native ownership while close releases exactly that worker", async () => {
  const f = acpFixture();
  const runtime = new AcpAgentRuntime(f.backend);
  const first = await runtime.start(request);
  const second = await runtime.start(request);
  await first.detach();
  assert.equal(
    f.calls.some((call) => call[0] === "close"),
    false,
  );
  await second.send("Still usable");
  await second.close();
  assert.deepEqual(
    f.calls.filter((call) => call[0] === "close").map((call) => call[1]),
    [second.id],
  );
  await first.close();
});

test("unsupported approval mode closes startup without dispatching a prompt", async () => {
  const f = acpFixture();
  f.modeReady = false;
  await assert.rejects(
    new AcpAgentRuntime(f.backend).start(request),
    /execution_mode_required/,
  );
  assert.equal(f.calls.filter((call) => call[0] === "close").length, 1);
  assert.equal(
    submits(f).filter((call) => call[3].type === "prompt").length,
    0,
  );
});

test("default runtime refuses fabricated resume, external launch declarations and restricted work", async () => {
  const f = acpFixture();
  const runtime = new AcpAgentRuntime(f.backend);
  assert.equal(runtime.capabilities().resume, false);
  await assert.rejects(
    runtime.resume("old-controller-thread", request),
    /resume unavailable/,
  );
  assert.equal(await runtime.supports({ ...request, restricted: true }), false);
  await assert.rejects(
    runtime.start({
      ...request,
      mcpServers: [{ name: "unsafe", command: "node" }],
    }),
    /unsupported/,
  );
  assert.equal(f.calls.length, 0);
});

test("startup cannot silently replace a requested model with an unsupported default", async () => {
  const f = acpFixture();
  f.configuration = { model: { status: "unsupported" } };
  await assert.rejects(
    new AcpAgentRuntime(f.backend).start({
      ...request,
      model: { provider: "acp", model: "unavailable" },
    }),
    /requested_configuration_unavailable/,
  );
  assert.equal(
    submits(f).some((call) => call[3].type === "prompt"),
    false,
  );
  assert.equal(f.calls.filter((call) => call[0] === "close").length, 1);
});

test("lost open acknowledgement closes the owned request without retrying startup", async () => {
  const f = acpFixture();
  const original = f.backend.client.open;
  f.backend.client.open = async (...args) => {
    await original(...args);
    throw Error("open reply unknown");
  };
  await assert.rejects(
    new AcpAgentRuntime(f.backend).start(request),
    /open reply unknown/,
  );
  assert.equal(f.calls.filter((call) => call[0] === "open").length, 1);
  assert.equal(f.calls.filter((call) => call[0] === "close").length, 1);
});

test("startup preserves cleanup failure alongside the original open uncertainty", async () => {
  const f = acpFixture();
  const original = f.backend.client.open;
  f.backend.client.open = async (...args) => {
    await original(...args);
    throw Error("open reply unknown");
  };
  f.backend.close = async () => {
    throw Error("cleanup failed");
  };
  await assert.rejects(
    new AcpAgentRuntime(f.backend).start(request),
    (error) => {
      assert.ok(error instanceof AggregateError);
      assert.match(error.message, /startup cleanup failed/);
      assert.match(error.errors[0].message, /open reply unknown/);
      return true;
    },
  );
  assert.equal(f.calls.filter((call) => call[0] === "open").length, 1);
});

test("native cancel addresses the exact in-flight request and does not cancel another worker", async () => {
  const f = acpFixture();
  let turn;
  f.onPrompt = async (id, requestId) => {
    turn = { id, requestId };
  };
  const runtime = new AcpAgentRuntime(f.backend);
  const first = await runtime.start(request);
  const second = await runtime.start(request);
  const pending = first.send("Wait");
  await until(() => turn);
  await first.cancel();
  const cancelled = submits(f).find((call) => call[3].type === "cancel");
  assert.equal(cancelled[1], first.id);
  assert.equal(cancelled[3].target, turn.requestId);
  f.emit(turn.id, "record", turn.requestId, {
    record: { status: "cancelled" },
  });
  await assert.rejects(pending, { outcome: "unknown" });
  f.onPrompt = undefined;
  await second.send("Independent");
  await first.close();
  await second.close();
});

test("closing during context preparation fences late dispatch and retains no invented completion", async () => {
  const f = acpFixture();
  const session = await new AcpAgentRuntime(f.backend).start(request);
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const sending = session.send("Authored", {
    prepareContext: async () => {
      await gate;
      return [memory];
    },
  });
  const cancelled = assert.rejects(sending, { name: "AbortError" });
  await session.close();
  release();
  await cancelled;
  assert.equal(
    submits(f).filter((call) => call[3].type === "prompt").length,
    0,
  );
  const events = [];
  for await (const event of session.events()) events.push(event);
  assert.equal(
    events.some((event) => event.type === "completed"),
    false,
  );
});
