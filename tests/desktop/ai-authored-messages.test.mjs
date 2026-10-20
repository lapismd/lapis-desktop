import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { nativeSession } from "./native-session.mjs";

const id = (value) => value.toString(16).padStart(2, "0").repeat(16);
const token = `ghp_${"NQLObn7M3OTKBL44TH6K9WxFY39LZM1sDc0K"}`;
async function invoke(session, command, args = {}) {
  const ticket = randomUUID();
  await session.browser.execute(
    (ticket, command, args) => {
      globalThis.__authoredJobs ??= {};
      const jobs = globalThis.__authoredJobs;
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
        (ticket) => !globalThis.__authoredJobs[ticket].pending,
        ticket,
      ),
    { timeout: 60000, interval: 100 },
  );
  const result = await session.browser.execute((ticket) => {
    const result = globalThis.__authoredJobs[ticket];
    delete globalThis.__authoredJobs[ticket];
    return result;
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
async function admit(session, root, path) {
  writeFileSync(join(root, "picker.json"), JSON.stringify(path));
  const vault = await invoke(session, "vault_select");
  await invoke(session, "desktop_ai_admit", {
    request: { sessionId: vault.sessionId },
  });
  return vault;
}
function jj(path, ...args) {
  return execFileSync("/opt/homebrew/bin/jj", ["--no-pager", ...args], {
    cwd: path,
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
const operation = (path) =>
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
  );

test(
  "cold native authored messages retain sanitized human authorship and recover only the original receipt",
  { timeout: 180000 },
  async (context) => {
    const base = resolve(
      process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT ?? ".local/native-test",
    );
    mkdirSync(base, { recursive: true });
    const root = mkdtempSync(join(base, "ai-authored-messages-"));
    const path = join(root, "Authored notes café");
    mkdirSync(path);
    jj(path, "git", "init", "--no-colocate");
    const note = "# Preserve unsnapshotted authored notes\n";
    writeFileSync(join(path, "Note.md"), note);
    const before = operation(path);
    const first = await nativeSession(
      "ai-authored-messages",
      root,
      undefined,
      [],
      { background: true },
    );
    context.after(first.cleanup);
    const vault = await admit(first, root, path);
    await backend(first, vault, {
      type: "select",
      requestId: id(1),
      expectedRevision: 0,
      backend: "jj",
    });
    const owner = await backend(first, vault, {
      type: "open",
      requestId: id(2),
    });
    const handle = owner.data.handle;
    await backend(first, vault, {
      type: "prepareConversation",
      handle,
      requestId: id(3),
      title: "Native authored conversation",
    });
    const command = {
      type: "appendConversationMessage",
      handle,
      requestId: id(4),
      conversationRequestId: id(3),
      text: `Keep this authored paragraph about ${path}/Note.md ${token}\n\nSecond paragraph.`,
    };
    const written = await backend(first, vault, command);
    assert.equal(written.type, "conversationMessage");
    const receipt = JSON.parse(written.data.receipt);
    assert.equal(receipt.request_id, id(4));
    assert.ok(receipt.result.result.message);
    assert.deepEqual(await backend(first, vault, command), written);
    const encoded = (
      await backend(first, vault, {
        type: "readConversation",
        handle,
        requestId: id(3),
      })
    ).data;
    const view = JSON.parse(encoded);
    assert.equal(view.messages.length, 1);
    assert.equal(view.messages[0].message_id, written.data.messageId);
    assert.equal(
      view.messages[0].body,
      "Keep this authored paragraph about $WORKSPACE/Note.md [REDACTED]\n\nSecond paragraph.",
    );
    assert.deepEqual(view.sessions, []);
    assert.equal(encoded.includes(token), false);
    assert.equal(encoded.includes(path), false);
    assert.deepEqual(await invoke(first, "plugin:lapis-ai|list"), []);
    const selectedRef = join(path, ".jj/repo/store/git/refs/lapis/state/v1");
    const selected = readFileSync(selectedRef, "utf8");
    await invoke(first, "vault_close", { sessionId: vault.sessionId });
    await first.close(true);

    const profiles = join(root, "profile/ai-backends-v1");
    const names = readdirSync(profiles);
    assert.equal(names.length, 1);
    const privateRecord = join(
      profiles,
      names[0],
      "conversation-messages-v1",
      `${id(4)}.json`,
    );
    const retained = readFileSync(privateRecord, "utf8");
    assert.equal(retained.includes(token), false);
    assert.equal(retained.includes(path), false);
    // Simulate a lost local confirmation after the provider committed and the
    // process quit. Cold recovery must consult that original provider receipt.
    const unconfirmed = JSON.parse(retained);
    unconfirmed.receipt = null;
    writeFileSync(privateRecord, JSON.stringify(unconfirmed), { mode: 0o600 });
    const cold = await nativeSession(
      "ai-authored-messages-cold",
      root,
      undefined,
      [],
      { background: true },
    );
    context.after(cold.cleanup);
    const reopened = await admit(cold, root, path);
    const fresh = (
      await backend(cold, reopened, { type: "open", requestId: id(5) })
    ).data.handle;
    const recovered = await backend(cold, reopened, {
      type: "conversationMessageStatus",
      handle: fresh,
      requestId: id(4),
      conversationRequestId: id(3),
    });
    assert.deepEqual(recovered, written);
    assert.deepEqual(
      await backend(cold, reopened, { ...command, handle: fresh }),
      written,
    );
    assert.equal(
      (
        await backend(cold, reopened, {
          type: "readConversation",
          handle: fresh,
          requestId: id(3),
        })
      ).data,
      encoded,
    );
    await assert.rejects(() =>
      backend(cold, reopened, {
        ...command,
        handle: fresh,
        text: "Different original intent",
      }),
    );
    await assert.rejects(() => backend(cold, reopened, command));
    assert.equal(readFileSync(selectedRef, "utf8"), selected);
    assert.equal(readFileSync(join(path, "Note.md"), "utf8"), note);
    assert.equal(operation(path), before);
    assert.deepEqual(await invoke(cold, "plugin:lapis-ai|list"), []);
    assert.ok(JSON.parse(readFileSync(privateRecord, "utf8")).receipt);
    await invoke(cold, "vault_close", { sessionId: reopened.sessionId });
    await cold.close(true);
    console.log(`Native authored-message evidence: ${root}`);
  },
);
