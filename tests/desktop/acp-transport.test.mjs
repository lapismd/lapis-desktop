import test from "node:test";
import assert from "node:assert/strict";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { nativeSession } from "./native-session.mjs";
import { nativeFailure } from "./conflict-review.mjs";

function root(name) {
  return mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, `acp-${name}-`),
  );
}
function records(path) {
  try {
    return readFileSync(join(path, "acp-peer.jsonl"), "utf8")
      .trim()
      .split("\n")
      .map(JSON.parse);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}
async function open(session, id) {
  const info = await session.browser.execute(
    (id) => globalThis.__lapisAcpAcceptance.open(id),
    id,
  );
  const configured = await send(session, id, `configure-${id}`, {
    type: "configure",
    mode: "ask",
  });
  assert.equal(configured.type, "configured");
  assert.equal(configured.modeReady, true);
  return info;
}
function send(session, id, requestId, request) {
  return session.browser.execute(
    (id, requestId, request) =>
      globalThis.__lapisAcpAcceptance.send(id, requestId, request),
    id,
    requestId,
    request,
  );
}
const prompt = (text) => ({
  type: "prompt",
  text,
  context: "<context>private facts</context>",
  max_duration_ms: 10000,
});
async function permission(session, id) {
  let value;
  await session.browser.waitUntil(async () => {
    value = await session.browser.execute(
      (id) =>
        globalThis.__lapisAcpAcceptance
          .events(id)
          .flatMap((snapshot) => snapshot.events)
          .find((event) => event.frame.type === "permission")?.frame,
      id,
    );
    return Boolean(value);
  });
  return value;
}
async function stopped(session, path) {
  await session.browser.waitUntil(
    () =>
      records(path)
        .filter((item) => item.pid)
        .every(({ pid }) => {
          try {
            process.kill(pid, 0);
            return false;
          } catch (error) {
            assert.equal(error.code, "ESRCH");
            return true;
          }
        }),
    {
      timeout: 8000,
      timeoutMsg: "Every owned compiled ACP provider must be reaped",
    },
  );
}
function control(session, operation) {
  return session.browser.execute(
    (operation) =>
      globalThis.__TAURI__.core.invoke("acp_acceptance_control", { operation }),
    operation,
  );
}

test("cold packaged ACP commands preserve context, ordered frames, exact permissions and independent workers", async (context) => {
  const path = root("frames");
  const session = await nativeSession("acp-frames", path);
  context.after(session.cleanup);
  assert.deepEqual(records(path), []);
  const targets = await session.browser.execute(() =>
    globalThis.__lapisAcpAcceptance.targets(),
  );
  assert.equal(targets[0].id, "compiled-fixture");
  const one = await open(session, "one");
  const two = await open(session, "two");
  assert.notEqual(one.sessionId, two.sessionId);
  assert.equal(
    records(path).some((item) => item.method === "session/prompt"),
    false,
  );
  await session.browser.execute((request) => {
    globalThis.__acpTurn = globalThis.__lapisAcpAcceptance.send(
      "one",
      "permission-turn",
      request,
    );
    globalThis.__acpTurn.catch(() => {});
  }, prompt("permission"));
  const choice = await permission(session, "one");
  assert.equal(choice.request.options[0].optionId, "custom:allow-one");
  const invalid = await session.browser.execute(async (permissionId) => {
    try {
      await globalThis.__lapisAcpAcceptance.send("one", "invalid", {
        type: "permission",
        permission_id: permissionId,
        option_id: "allow_once",
      });
      return false;
    } catch (error) {
      return error.code === "stale_or_invalid_permission";
    }
  }, choice.permissionId);
  assert.equal(invalid, true);
  const other = await send(session, "two", "other-turn", prompt("independent"));
  assert.equal(other.record.status, "completed");
  await send(session, "one", "choice", {
    type: "permission",
    permission_id: choice.permissionId,
    option_id: "custom:allow-one",
  });
  const result = await session.browser.execute(() => globalThis.__acpTurn);
  assert.equal(result.record.status, "completed");
  const log = records(path);
  const sent = log.find(
    (item) =>
      item.method === "session/prompt" &&
      item.params.prompt.at(-1).text === "permission",
  );
  assert.equal(
    sent.params.prompt[0].resource.text,
    "<context>private facts</context>",
  );
  assert.equal(sent.params.prompt.at(-1).text, "permission");
  assert.ok(
    log.some((item) => item.result?.outcome?.optionId === "custom:allow-one"),
  );
  const events = await session.browser.execute(() =>
    globalThis.__lapisAcpAcceptance
      .events("one")
      .flatMap((snapshot) => snapshot.events),
  );
  assert.deepEqual(
    events.map((event) => event.sequence),
    events.map((_, index) => index + 1),
  );
  await session.browser.execute(() =>
    globalThis.__lapisAcpAcceptance.close("one"),
  );
  assert.equal(
    (await send(session, "two", "follow-up", prompt("still alive"))).record
      .status,
    "completed",
  );
  await session.close();
  await stopped(session, path);
});

test("renderer reload reconnects retained work without prompting again; actual exit reaps providers", async (context) => {
  const path = root("reload");
  const session = await nativeSession("acp-reload", path);
  context.after(session.cleanup);
  const info = await open(session, "reload");
  await session.browser.execute((request) => {
    globalThis.__lapisAcpAcceptance
      .send("reload", "waiting", request)
      .catch(() => {});
  }, prompt("permission"));
  const choice = await permission(session, "reload");
  const cursor = await session.browser.execute(() =>
    globalThis.__lapisAcpAcceptance.detach("reload"),
  );
  await session.browser.execute(() => {
    globalThis.__acpOldDocument = true;
  });
  await session.browser.refresh();
  await session.browser.waitUntil(() =>
    session.browser.execute(
      () =>
        !globalThis.__acpOldDocument &&
        Boolean(globalThis.__lapisAcpAcceptance) &&
        document.documentElement.dataset.shellReady === "true",
    ),
  );
  const listed = await session.browser.execute(() =>
    globalThis.__lapisAcpAcceptance.list(),
  );
  assert.equal(listed.length, 1);
  assert.equal(listed[0].sessionId, info.sessionId);
  await session.browser.execute(
    (info, cursor) =>
      globalThis.__lapisAcpAcceptance.reconnect("retained", info, cursor),
    info,
    cursor,
  );
  await send(session, "retained", "answer", {
    type: "permission",
    permission_id: choice.permissionId,
    option_id: "custom:allow-one",
  });
  await session.browser.waitUntil(() =>
    session.browser.execute(() =>
      globalThis.__lapisAcpAcceptance
        .events("retained")
        .some((snapshot) =>
          snapshot.events.some((event) => event.frame.type === "record"),
        ),
    ),
  );
  assert.equal(
    records(path).filter((item) => item.method === "session/prompt").length,
    1,
  );
  assert.equal(records(path).filter((item) => item.pid).length, 1);
  await session.close();
  await stopped(session, path);
});

test("cancellation retires exact permission; disabled and revoked handles cannot reach old workers", async (context) => {
  const path = root("revoke");
  const session = await nativeSession("acp-revoke", path);
  context.after(session.cleanup);
  const info = await open(session, "cancel");
  await session.browser.execute((request) => {
    globalThis.__acpCancelled = globalThis.__lapisAcpAcceptance.send(
      "cancel",
      "waiting",
      request,
    );
    globalThis.__acpCancelled.catch(() => {});
  }, prompt("wait"));
  const choice = await permission(session, "cancel");
  await send(session, "cancel", "cancel-request", {
    type: "cancel",
    target: "waiting",
  });
  assert.equal(
    (await session.browser.execute(() => globalThis.__acpCancelled)).record
      .status,
    "cancelled",
  );
  const stale = await session.browser.execute(async (id) => {
    try {
      await globalThis.__lapisAcpAcceptance.send("cancel", "stale", {
        type: "permission",
        permission_id: id,
        option_id: "custom:allow-one",
      });
      return false;
    } catch {
      return true;
    }
  }, choice.permissionId);
  assert.equal(stale, true);
  await control(session, "disable");
  await stopped(session, path);
  await control(session, "enable");
  const denied = await session.browser.execute(async (info) => {
    try {
      await globalThis.__lapisAcpAcceptance.raw.submit(info.sessionId, "old", {
        type: "status",
      });
      return false;
    } catch {
      return true;
    }
  }, info);
  assert.equal(denied, true);
  await open(session, "new");
  await control(session, "revoke");
  assert.deepEqual(
    await session.browser.execute(() => globalThis.__lapisAcpAcceptance.list()),
    [],
  );
  await stopped(session, path);
  await session.close();
});

test("compiled provider failure reports an unknown outcome and never replays", async (context) => {
  const path = root("failure");
  const session = await nativeSession("acp-failure", path);
  context.after(session.cleanup);
  await open(session, "failure");
  const result = await send(session, "failure", "once", prompt("crash"));
  assert.equal(result.record.status, "outcome_unknown");
  await session.browser.waitUntil(() =>
    session.browser.execute(
      () => globalThis.__lapisAcpAcceptance.failures().length > 0,
    ),
  );
  assert.equal(
    records(path).filter((item) => item.method === "session/prompt").length,
    1,
  );
  await stopped(session, path);
  await session.close();
});

test("another actual WebView with ACP command grants cannot observe or affect the main worker", async (context) => {
  const path = root("window-scope");
  const session = await nativeSession("acp-window-scope", path);
  context.after(session.cleanup);
  const info = await open(session, "owned");
  await control(session, "other-window");
  await session.browser.waitUntil(async () =>
    (await session.browser.getWindowHandles()).includes("acp-other"),
  );
  await session.browser.switchToWindow("acp-other");
  await session.browser.waitUntil(() =>
    session.browser.execute(() => Boolean(globalThis.__TAURI__?.core?.invoke)),
  );
  const outcomes = await session.browser.execute(async (id) => {
    const invoke = globalThis.__TAURI__.core.invoke;
    const results = [];
    for (const [command, args] of [
      ["list", {}],
      ["targets", {}],
      ["snapshot", { sessionId: id, after: 0 }],
      [
        "submit",
        { sessionId: id, requestId: "foreign", request: { type: "status" } },
      ],
      ["close", { sessionId: id }],
    ]) {
      try {
        await invoke(`plugin:lapis-ai|${command}`, args);
        results.push("unexpected-success");
      } catch (error) {
        results.push(String(error));
      }
    }
    return results;
  }, info.sessionId);
  assert.deepEqual(outcomes, Array(5).fill("denied"));
  await session.browser.closeWindow();
  await session.browser.switchToWindow("main");
  assert.equal(
    (await send(session, "owned", "still-owned", prompt("isolated"))).record
      .status,
    "completed",
  );
  await session.close();
  await stopped(session, path);
});

test("cancelled application close retains ACP until guarded persistence permits actual exit", async (context) => {
  const path = root("cancelled-close");
  const vault = join(path, "Guarded vault");
  mkdirSync(vault);
  writeFileSync(join(vault, "Note.md"), "# Guarded close\n");
  writeFileSync(join(path, "picker.json"), JSON.stringify(vault));
  const session = await nativeSession("acp-cancelled-close", path);
  context.after(session.cleanup);
  context.after(() => chmodSync(vault, 0o755));
  await session.browser.$("button*=Open Vault").click();
  await session.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  const info = await open(session, "guarded");
  await session.browser.$('[data-path="Note.md"]').click();
  const editor = session.browser.$('.cm-content[contenteditable="true"]');
  await editor.waitForDisplayed();
  chmodSync(vault, 0o555);
  await editor.click();
  await editor.addValue("ACP close must wait for persistence");
  await session.requestClose();
  await session.browser.$(nativeFailure).waitForDisplayed();
  assert.equal(session.isRunning(), true);
  const listed = await session.browser.execute(() =>
    globalThis.__lapisAcpAcceptance.list(),
  );
  assert.equal(listed[0].sessionId, info.sessionId);
  assert.equal(
    (await send(session, "guarded", "still-running", { type: "status" })).type,
    "status",
  );
  chmodSync(vault, 0o755);
  await session.close();
  await stopped(session, path);
});
