import test from "node:test";
import assert from "node:assert/strict";
import { nativeRemotes } from "../../src/lib/native/repository/remotes.ts";

function fixture() {
  const calls = [];
  const snapshot = {
    revision: 17,
    capabilities: { githubDeviceSignIn: true },
    settings: {
      deviceSignInAvailable: true,
      authorization: {
        state: "pending",
        code: "CURRENT-CODE",
        url: "https://github.com/login/device",
      },
    },
  };
  let respond = async () => snapshot;
  const call = async (command, args) => {
    calls.push([command, args]);
    return respond(command, args);
  };
  const service = nativeRemotes("opaque-session", call);
  return {
    calls,
    snapshot,
    service,
    setRespond: (action) => {
      respond = action;
    },
  };
}

test("forwards exact remote and native recovery commands with only the admitted session", async () => {
  const f = fixture();
  assert.equal(await f.service.read(), f.snapshot);
  const push = {
    kind: "push",
    target: "original",
    expectedRevision: 17,
    reviewId: "review",
  };
  assert.equal(await f.service.execute(push), f.snapshot);
  await f.service.synchronization.read();
  const recovery = {
    kind: "resume_apply",
    expected_revision: 19,
    request_id: "retained-apply",
  };
  await f.service.synchronization.execute(recovery);
  assert.deepEqual(f.calls, [
    [
      "desktop_repository_remotes",
      { request: { sessionId: "opaque-session", command: null } },
    ],
    [
      "desktop_repository_remotes",
      { request: { sessionId: "opaque-session", command: push } },
    ],
    [
      "desktop_repository_synchronization",
      { request: { sessionId: "opaque-session", command: null } },
    ],
    [
      "desktop_repository_synchronization",
      { request: { sessionId: "opaque-session", command: recovery } },
    ],
  ]);
});

test("normalizes native errors and never retries uncertain publication", async () => {
  const f = fixture();
  f.setRespond(async () => {
    throw { code: "EIO", message: "Lost response" };
  });
  await assert.rejects(
    f.service.execute({
      kind: "push",
      target: "backup",
      expectedRevision: 17,
      reviewId: "exact",
    }),
    (error) =>
      error instanceof Error &&
      error.code === "EIO" &&
      error.message === "Lost response",
  );
  assert.equal(f.calls.length, 1);
});

test("re-reads the current GitHub code and copies it before opening the verification URL", async () => {
  const f = fixture();
  await f.service.read();
  f.snapshot.settings.authorization.code = "NEW-CODE";
  await f.service.openSignIn();
  assert.deepEqual(f.calls.slice(1), [
    [
      "desktop_repository_remotes",
      { request: { sessionId: "opaque-session", command: null } },
    ],
    ["desktop_clipboard_write", { text: "NEW-CODE" }],
    ["desktop_external_open", { url: "https://github.com/login/device" }],
  ]);
});

for (const url of [
  "http://github.com/login/device",
  "https://secret@github.com/login/device",
  "https://github.com/login/device?code=secret",
  "https://github.com/login/device#secret",
  "https://github.com/other",
  "javascript:alert(1)",
]) {
  test(`refuses unsafe verification URL before clipboard or browser: ${url}`, async () => {
    const f = fixture();
    f.snapshot.settings.authorization.url = url;
    await assert.rejects(f.service.openSignIn(), /verification page/);
    assert.equal(f.calls.length, 1);
  });
}

test("refuses expired authorization and clipboard failure without opening a URL", async () => {
  const f = fixture();
  f.snapshot.settings.authorization.state = "expired";
  await assert.rejects(f.service.openSignIn(), /Sign in again/);
  f.snapshot.settings.authorization.state = "pending";
  f.setRespond(async (command) => {
    if (command === "desktop_clipboard_write")
      throw new Error("Clipboard unavailable");
    return f.snapshot;
  });
  await assert.rejects(f.service.openSignIn(), /Clipboard unavailable/);
  assert.equal(
    f.calls.some(([command]) => command === "desktop_external_open"),
    false,
  );
});

for (const kind of ["remote", "synchronization"]) {
  test(`fences late ${kind} delivery and new commands after close`, async () => {
    const f = fixture();
    let deliver;
    f.setRespond(
      () =>
        new Promise((resolve) => {
          deliver = resolve;
        }),
    );
    const service = kind === "remote" ? f.service : f.service.synchronization;
    const pending = service.read();
    const refused = assert.rejects(pending, /closed/);
    f.service.close();
    await assert.rejects(service.read(), /closed/);
    deliver(f.snapshot);
    await refused;
    assert.equal(f.calls.length, 1);
  });
}

test("does not open a verification page when the observer closes during clipboard delivery", async () => {
  const f = fixture();
  f.setRespond(async (command) => {
    if (command === "desktop_clipboard_write") f.service.close();
    return f.snapshot;
  });
  await assert.rejects(f.service.openSignIn(), /closed/);
  assert.equal(
    f.calls.some(([command]) => command === "desktop_external_open"),
    false,
  );
});
