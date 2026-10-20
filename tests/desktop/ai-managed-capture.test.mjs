import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { nativeSession } from "./native-session.mjs";

const configuration = process.env.LAPIS_AI_TEST_RUNTIME_CONFIG;
const id = (number) => number.toString(16).padStart(2, "0").repeat(16);
const marker = "MANAGED_NATIVE_CAPTURE";
async function invoke(session, command, args = {}) {
  const ticket = randomUUID();
  await session.browser.execute(
    (ticket, command, args) => {
      globalThis.__managedNativeJobs ??= {};
      const jobs = globalThis.__managedNativeJobs;
      jobs[ticket] = { pending: true };
      void globalThis.__TAURI__.core.invoke(command, args).then(
        (value) => (jobs[ticket] = { value }),
        (error) =>
          (jobs[ticket] = {
            failure: String(error?.code ?? error?.message ?? error),
          }),
      );
    },
    ticket,
    command,
    args,
  );
  await session.browser.waitUntil(
    () =>
      session.browser.execute(
        (ticket) => !globalThis.__managedNativeJobs[ticket].pending,
        ticket,
      ),
    { timeout: 60000, interval: 100 },
  );
  const result = await session.browser.execute((ticket) => {
    const value = globalThis.__managedNativeJobs[ticket];
    delete globalThis.__managedNativeJobs[ticket];
    return value;
  }, ticket);
  if (result.failure) throw new Error(`${command}: ${result.failure}`);
  return result.value;
}
async function backend(session, vault, operation) {
  const encoded = await invoke(session, "desktop_ai_backends", {
    request: JSON.stringify({
      version: 1,
      sessionId: vault.sessionId,
      operation,
    }),
  });
  const reply = JSON.parse(encoded);
  assert.equal(reply.version, 1);
  return reply.data;
}
function jj(vault, ...args) {
  return execFileSync("/opt/homebrew/bin/jj", ["--no-pager", ...args], {
    cwd: vault,
    encoding: "utf8",
    stdio: "pipe",
    env: {
      ...process.env,
      JJ_CONFIG: "/dev/null",
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_CONFIG_GLOBAL: "/dev/null",
    },
  }).trim();
}
async function admit(session, root, path) {
  writeFileSync(join(root, "picker.json"), JSON.stringify(path));
  const vault = await invoke(session, "vault_select");
  await invoke(session, "desktop_ai_admit", {
    request: { sessionId: vault.sessionId },
  });
  return vault;
}
async function session(context, name, root) {
  const active = await nativeSession(name, root, undefined, [], {
    background: true,
  });
  context.after(active.cleanup);
  return active;
}
async function terminal(session, sessionId, requestId, type) {
  let frame;
  await session.browser.waitUntil(
    async () => {
      const snapshot = await invoke(session, "plugin:lapis-ai|snapshot", {
        sessionId,
        after: 0,
      });
      const frames = snapshot.events.map((event) => event.frame);
      assert.equal(
        frames.some((event) => event.type === "permission"),
        false,
        "This no-tools turn must not request permission",
      );
      const error = frames.find((event) => event.type === "error");
      assert.equal(error, undefined, error?.code);
      frame = frames.find(
        (event) => event.requestId === requestId && event.type === type,
      );
      return Boolean(frame);
    },
    { timeout: 120000, interval: 200 },
  );
  return frame;
}

test(
  "cold ordinary native managed Codex capture retains the exact conversation without replaying a provider",
  {
    skip: !configuration,
    timeout: 240000,
  },
  async (context) => {
    const base = resolve(
      process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT ?? ".local/native-test",
    );
    mkdirSync(base, { recursive: true });
    const root = mkdtempSync(join(base, "ai-managed-capture-"));
    const path = join(root, "Managed JJ café");
    mkdirSync(path);
    mkdirSync(join(root, "profile"));
    copyFileSync(configuration, join(root, "profile/ai-runtime.json"));
    jj(path, "git", "init", "--no-colocate");
    const note = "# Keep this unsnapshotted note\n";
    writeFileSync(join(path, "Note.md"), note);
    const operation = jj(
      path,
      "--ignore-working-copy",
      "op",
      "log",
      "--limit",
      "1",
      "--no-graph",
      "-T",
      "id",
    );
    const first = await session(context, "ai-managed-capture", root);
    const vault = await admit(first, root, path);
    await backend(first, vault, {
      type: "select",
      requestId: id(1),
      expectedRevision: 0,
      backend: "jj",
    });
    const opened = await backend(first, vault, {
      type: "open",
      requestId: id(2),
    });
    const handle = opened.data.handle;
    const conversation = await backend(first, vault, {
      type: "prepareConversation",
      handle,
      requestId: id(3),
      title: "Managed native capture",
    });
    const prepared = await backend(first, vault, {
      type: "prepareManagedCapture",
      handle,
      requestId: id(4),
      conversationRequestId: id(3),
      clientId: "codex",
    });
    const targetId = prepared.data.targetId;
    const native = await invoke(first, "plugin:lapis-ai|open", {
      requestId: randomUUID(),
      targetId,
    });
    assert.ok(native.sessionId);
    await assert.rejects(() =>
      invoke(first, "plugin:lapis-ai|open", {
        requestId: randomUUID(),
        targetId,
      }),
    );
    assert.equal((await invoke(first, "plugin:lapis-ai|list")).length, 1);
    const configure = randomUUID();
    await invoke(first, "plugin:lapis-ai|submit", {
      sessionId: native.sessionId,
      requestId: configure,
      request: { type: "configure", mode: "read-only" },
    });
    const configured = await terminal(
      first,
      native.sessionId,
      configure,
      "configured",
    );
    assert.equal(configured.modeReady, true);
    const turn = randomUUID();
    const authored = `Do not use tools or inspect files. Reply with exactly ${marker} and no other text.`;
    const injected =
      "Injected vault context must stay separate from human authorship.";
    await invoke(first, "plugin:lapis-ai|submit", {
      sessionId: native.sessionId,
      requestId: turn,
      request: {
        type: "prompt",
        text: authored,
        context: injected,
        max_duration_ms: 90000,
      },
    });
    const completed = await terminal(first, native.sessionId, turn, "record");
    assert.equal(completed.record.status, "completed");
    assert.equal(completed.assistantText.trim(), marker);
    await invoke(first, "plugin:lapis-ai|close", {
      sessionId: native.sessionId,
    });
    const encoded = (
      await backend(first, vault, {
        type: "readConversation",
        handle,
        requestId: id(3),
      })
    ).data;
    const view = JSON.parse(encoded);
    assert.deepEqual(view.conversation, conversation.data);
    assert.equal(view.sessions.length, 1);
    const chunks = view.sessions[0].transcripts.flatMap(
      (stream) => stream.chunks,
    );
    assert.equal(
      chunks.filter((chunk) => chunk.text === completed.assistantText).length,
      1,
      "The exact assistant projection must survive, independently of the longer authored prompt",
    );
    assert.equal(view.messages.length, 1);
    assert.equal(view.messages[0].body, authored);
    assert.equal(view.messages[0].body.includes(injected), false);
    const authoredStatus = await backend(first, vault, {
      type: "conversationMessageStatus",
      handle,
      requestId: turn.replaceAll("-", ""),
      conversationRequestId: id(3),
    });
    assert.ok(authoredStatus.data.receipt);
    assert.equal(authoredStatus.data.messageId, view.messages[0].message_id);
    assert.equal(
      encoded.includes(path),
      false,
      "Native transcript paths are sanitized before storage and reading",
    );
    const ref = join(path, ".jj/repo/store/git/refs/lapis/state/v1");
    const selected = readFileSync(ref, "utf8");
    await invoke(first, "vault_close", { sessionId: vault.sessionId });
    await first.close(true);

    const cold = await session(context, "ai-managed-capture-reopen", root);
    const reopened = await admit(cold, root, path);
    assert.deepEqual((await backend(cold, reopened, { type: "read" })).data, {
      backend: "jj",
      revision: 1,
    });
    const owner = await backend(cold, reopened, {
      type: "open",
      requestId: id(5),
    });
    const restored = (
      await backend(cold, reopened, {
        type: "readConversation",
        handle: owner.data.handle,
        requestId: id(3),
      })
    ).data;
    assert.equal(restored, encoded);
    assert.deepEqual(await invoke(cold, "plugin:lapis-ai|list"), []);
    await assert.rejects(() =>
      invoke(cold, "plugin:lapis-ai|open", {
        requestId: randomUUID(),
        targetId,
      }),
    );
    assert.deepEqual(await invoke(cold, "plugin:lapis-ai|list"), []);
    assert.equal(
      readFileSync(ref, "utf8"),
      selected,
      "Cold reads and a stale target cannot republish capture or start a provider",
    );
    assert.equal(readFileSync(join(path, "Note.md"), "utf8"), note);
    assert.equal(
      jj(
        path,
        "--ignore-working-copy",
        "op",
        "log",
        "--limit",
        "1",
        "--no-graph",
        "-T",
        "id",
      ),
      operation,
    );
    await invoke(cold, "vault_close", { sessionId: reopened.sessionId });
    await cold.close(true);
    writeFileSync(
      join(root, "managed-capture-receipt.json"),
      JSON.stringify(
        {
          conversation: conversation.data,
          selected,
          sessions: view.sessions.length,
          messages: view.messages.length,
          marker,
        },
        null,
        2,
      ) + "\n",
    );
  },
);
