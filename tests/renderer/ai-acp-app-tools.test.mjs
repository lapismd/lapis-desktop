import test from "node:test";
import assert from "node:assert/strict";
import { AcpAgentRuntime } from "../../src/lib/ai/runtimes/acp/runtime.ts";
import { acpFixture, until } from "../fixtures/ai/acp-transport.mjs";
const request = {
  prompt: "",
  agent: "agent",
  appToolSession: {
    conversationId: "conversation",
    agentBindingId: "binding",
    scopeDir: "",
    tools: [],
    status: "available",
    bridgeId: "bridge",
  },
};
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
function fixture(ending = async () => {}, provider = "agent") {
  const f = acpFixture(),
    actions = [];
  f.backend.tools = {
    target: (descriptor, base) => {
      assert.equal(descriptor.bridgeId, "bridge");
      assert.equal(base, provider);
      return "opaque-tools-target";
    },
    arm: async (_bridge, turn) => {
      actions.push(["arm", turn]);
    },
    end: async (_bridge, turn) => {
      actions.push(["end", turn]);
      await ending();
    },
  };
  if (provider === "codex")
    f.backend.client.targets = async () => [{ id: "codex", label: "Codex" }];
  return { f, actions, runtime: new AcpAgentRuntime(f.backend) };
}
test("opaque Codex tool targets retain its exact advertised read-only mode", async () => {
  const setup = fixture(async () => {}, "codex");
  const session = await setup.runtime.start({ ...request, agent: "codex" });
  assert.equal(
    setup.f.calls.find(
      (call) => call[0] === "submit" && call[3].type === "configure",
    )[3].mode,
    "read-only",
  );
  await session.close();
});

test("provider permissions use observed tool context and preserve their exact choices", async () => {
  const setup = fixture(async () => {}, "codex");
  let turn;
  setup.f.onPrompt = async (id, requestId) => {
    turn = { id, requestId };
    setup.f.emit(id, "activity", requestId, {
      update: {
        sessionUpdate: "tool_call",
        toolCallId: "call-context",
        title: "mcp.lapis-tools.read",
        kind: "execute",
      },
    });
    setup.f.emit(id, "permission", requestId, {
      permissionId: "provider-permission",
      request: {
        toolCall: { toolCallId: "call-context", kind: "execute" },
        options: [
          {
            optionId: "provider-exact-once",
            name: "Allow",
            kind: "allow_once",
          },
        ],
      },
    });
  };
  const session = await setup.runtime.start({ ...request, agent: "codex" });
  const sending = session.send("Read");
  const events = session.events()[Symbol.asyncIterator]();
  const tool = (await events.next()).value;
  assert.equal(tool.server, "lapis-tools");
  const approval = (await events.next()).value.request;
  assert.equal(approval.title, "mcp.lapis-tools.read");
  assert.equal(approval.kind, "execute");
  assert.equal(approval.options[0].id, "provider-exact-once");
  await session.respondToApproval(approval.id, approval.options[0].id);
  setup.f.emit(turn.id, "activity", turn.requestId, {
    update: {
      sessionUpdate: "tool_call_update",
      toolCallId: "call-context",
      status: "completed",
      rawInput: { server: "lapis-tools", tool: "read" },
    },
  });
  assert.equal((await events.next()).value.server, "lapis-tools");
  setup.f.emit(turn.id, "record", turn.requestId, {
    record: { status: "completed", stopReason: "end_turn" },
  });
  await sending;
  await session.close();
});
test("app tools arm after context and hold terminal publication without blocking native delivery", async () => {
  const gate = deferred(),
    setup = fixture(() => gate.promise);
  const session = await setup.runtime.start(request);
  assert.equal(setup.f.calls[0][1].targetId, "opaque-tools-target");
  const events = session.events()[Symbol.asyncIterator]();
  let received = false;
  const next = events.next().then((value) => {
    received = true;
    return value;
  });
  const sending = session.send("Prompt", {
    prepareContext: async () => {
      assert.equal(setup.actions.length, 0);
      return [];
    },
  });
  await until(() => setup.actions.some((a) => a[0] === "end"));
  assert.equal(received, false);
  await assert.rejects(session.send("Another"), /busy/);
  gate.resolve();
  await sending;
  assert.equal((await next).value.type, "completed");
  assert.equal(setup.actions[0][1], setup.actions[1][1]);
  assert.equal(setup.actions.length, 2);
  await session.close();
});
test("unknown tool drain retires the native worker and never publishes successful completion", async () => {
  const setup = fixture(async () => {
    throw Error("Drain unknown");
  });
  const session = await setup.runtime.start(request);
  const events = session.events()[Symbol.asyncIterator]();
  await assert.rejects(
    session.send("Prompt"),
    (error) => error.outcome === "unknown",
  );
  const event = (await events.next()).value;
  assert.equal(event.type, "error");
  assert.equal(event.error.outcome, "unknown");
  assert.equal((await events.next()).done, true);
  assert.equal(setup.f.calls.filter((call) => call[0] === "close").length, 1);
  assert.equal(setup.actions.filter((a) => a[0] === "end").length, 1);
});
test("tool-backed detach closes its non-resumable worker rather than leaving a parked provider", async () => {
  const setup = fixture();
  const session = await setup.runtime.start(request);
  await session.detach();
  assert.equal(setup.f.calls.filter((call) => call[0] === "close").length, 1);
  assert.deepEqual(await setup.f.backend.client.list(), []);
});
test("cancellation during preparation dispatches neither a prompt nor a tool arm", async () => {
  const setup = fixture(),
    prepared = deferred();
  const session = await setup.runtime.start(request);
  const sending = session.send("Prompt", {
    prepareContext: async () => {
      await prepared.promise;
      return [];
    },
  });
  await session.cancel();
  prepared.resolve();
  await assert.rejects(sending);
  assert.deepEqual(setup.actions, []);
  assert.equal(
    setup.f.calls.filter(
      (call) => call[0] === "submit" && call[3].type === "prompt",
    ).length,
    0,
  );
  await session.close();
});
test("a lost prompt submission retires tool authority and cannot accept a late completion", async () => {
  const setup = fixture();
  setup.f.unknown = true;
  const session = await setup.runtime.start(request);
  const events = session.events()[Symbol.asyncIterator]();
  await assert.rejects(
    session.send("Prompt"),
    (error) => error.outcome === "unknown",
  );
  assert.equal((await events.next()).value.type, "error");
  assert.equal((await events.next()).done, true);
  assert.equal(setup.f.calls.filter((call) => call[0] === "close").length, 1);
});
