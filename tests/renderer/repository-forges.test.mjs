import test from "node:test";
import assert from "node:assert/strict";
import { ForgeController } from "../../src/lib/repository/forge-controller.ts";
import { nativeForges } from "../../src/lib/native/repository/forges.ts";
const empty = {
  accounts: [],
  oauth_available: true,
  keychain_supported: true,
  authorization: null,
};
const pending = {
  ...empty,
  authorization: {
    session: "opaque-auth",
    user_code: "ABCD-1234",
    verification_uri: "https://github.com/login/device",
    interval: 5,
    expires_at: 1000,
    state: "pending",
  },
};
function deferred() {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
}
function fixture() {
  const calls = [],
    errors = [],
    states = [];
  const service = {
    async inventory() {
      return empty;
    },
    async command(command) {
      calls.push(command);
      return command.kind === "begin_oauth" ? pending : empty;
    },
    async openAuthorization(url) {
      calls.push(url);
    },
  };
  const c = new ForgeController(service, {
    report: (error) => errors.push(error),
    recovered() {
      calls.push("recovered");
    },
  });
  c.subscribe((state) => states.push(state));
  return { service, c, calls, errors, states };
}
test("account tokens remain transient and never enter observable or persisted UI state", async () => {
  const f = fixture();
  await f.c.refresh();
  f.c.tokenFlow("pat");
  await f.c.addToken("https://api.github.com", "ephemeral-secret");
  assert.equal(JSON.stringify(f.states).includes("ephemeral-secret"), false);
  assert.equal(
    f.calls.find((call) => call.kind === "add_token").token,
    "ephemeral-secret",
  );
  assert.equal(f.states.at(-1).flow, "");
  await f.c.close();
});
test("closing during a slow sign-in does not hold vault close and cancels the late private grant", async () => {
  const f = fixture(),
    held = deferred();
  f.service.command = async (command) => {
    f.calls.push(command);
    return command.kind === "begin_oauth" ? held.promise : empty;
  };
  const activity = [];
  f.c.subscribeActivity((value) => activity.push(value));
  const started = f.c.begin();
  await f.c.close();
  let drained = false;
  const drain = f.c.drained().then(() => (drained = true));
  assert.equal(drained, false);
  assert.equal(activity.at(-1).busy, true);
  const count = f.states.length;
  held.resolve(pending);
  await started;
  await drain;
  assert.equal(activity.at(-1).busy, false);
  assert.equal(f.states.length, count);
  assert.deepEqual(
    f.calls.filter((call) => call.kind === "cancel_oauth"),
    [{ kind: "cancel_oauth", session: "opaque-auth" }],
  );
  assert.equal(f.errors.length, 0);
});
test("cancel fences an in-flight poll and clears its timer", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture(),
    poll = deferred();
  f.service.command = async (command) => {
    f.calls.push(command);
    return command.kind === "poll_oauth"
      ? poll.promise
      : command.kind === "begin_oauth"
        ? pending
        : empty;
  };
  await f.c.begin();
  context.mock.timers.tick(5000);
  assert.equal(f.calls.filter((call) => call.kind === "poll_oauth").length, 1);
  await f.c.cancel();
  poll.resolve(pending);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(f.states.at(-1).flow, "");
  assert.equal(f.states.at(-1).inventory.authorization, null);
  context.mock.timers.tick(60_000);
  assert.equal(f.calls.filter((call) => call.kind === "poll_oauth").length, 1);
  await f.c.close();
});
test("native account frames cannot select custody paths and never forward activation to arbitrary URLs", async () => {
  const calls = [];
  const service = nativeForges(async (command, args) => {
    calls.push({ command, args });
    return empty;
  });
  await service.inventory();
  await service.command({ kind: "forget", account: "known" });
  assert.deepEqual(calls[0], {
    command: "desktop_forge_accounts",
    args: { request: { command: null } },
  });
  assert.deepEqual(calls[1].args, {
    request: { command: { kind: "forget", account: "known" } },
  });
  await assert.rejects(
    service.openAuthorization("https://unrelated.example/login"),
    /Invalid/,
  );
  assert.equal(calls.length, 2);
});

test("Forgejo PAT uses its explicit native action without entering observable state", async () => {
  const f = fixture();
  await f.c.refresh();
  f.c.tokenFlow("forgejo");
  await f.c.addToken("https://forge.example/api/v1", "synthetic-forgejo");
  assert.deepEqual(
    f.calls.find((call) => call.kind === "add_forgejo_token"),
    {
      kind: "add_forgejo_token",
      api_url: "https://forge.example/api/v1",
      token: "synthetic-forgejo",
    },
  );
  assert.equal(f.states.at(-1).flow, "");
  assert.equal(JSON.stringify(f.states).includes("synthetic-forgejo"), false);
  await f.c.close();
  await f.c.drained();
});
