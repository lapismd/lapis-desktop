import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  writeFileSync,
  readFileSync,
  appendFileSync,
  existsSync,
} from "node:fs";
import { resolve, join, dirname } from "node:path";
import { nativeSession } from "./native-session.mjs";
async function invoke(session, command, args = {}) {
  return session.browser.execute(
    async (command, args) => {
      try {
        return {
          value: await globalThis.__TAURI__.core.invoke(command, args),
          failure: null,
        };
      } catch (error) {
        return { value: null, failure: String(error?.message ?? error) };
      }
    },
    command,
    args,
  );
}
async function request(session, request) {
  const result = await invoke(session, "desktop_ai_imports", { request });
  assert.equal(result.failure, null);
  return result.value;
}
async function work(session, handle, type, rest = {}) {
  const ticket = await request(session, { type: "prepare", handle });
  try {
    return await request(session, { type, handle, ticket, ...rest });
  } finally {
    await request(session, { type: "cancel", handle, ticket });
  }
}
async function open(session, root, vault) {
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  const selected = await invoke(session, "vault_select");
  assert.equal(selected.failure, null);
  const sessionId = selected.value.sessionId;
  const manual = await request(session, { type: "open", sessionId });
  const capture = await request(session, {
    type: "open",
    sessionId,
    purpose: "capture",
  });
  return { manual, capture, sessionId };
}
test(
  "cold native capture reobserves exact snapshots, fences handles and never admits execution or writes JJ",
  { timeout: 180_000 },
  async (context) => {
    mkdirSync(resolve(".local/native-test"), { recursive: true });
    const root = mkdtempSync(resolve(".local/native-test/ai-capture-sources-"));
    const vault = join(root, "Captured Notes");
    mkdirSync(vault);
    writeFileSync(join(vault, "Keep.md"), "# Preserved\n");
    const source = join(root, "import-home/.codex/sessions/rollout.jsonl");
    mkdirSync(dirname(source), { recursive: true });
    const header = {
      type: "session_meta",
      payload: {
        id: "12345678-1234-1234-1234-123456789abc",
        cwd: vault,
        cli_version: "0.156.1",
        source: "vscode",
        originator: "lapis-acp",
      },
    };
    const message = {
      timestamp: "2026-10-19T12:00:00Z",
      type: "response_item",
      payload: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: "Local capture evidence" }],
      },
    };
    writeFileSync(
      source,
      `${JSON.stringify(header)}\n${JSON.stringify(message)}\n`,
    );
    const first = await nativeSession("capture-source", root, undefined, [], {
      background: true,
    });
    context.after(first.cleanup);
    const handles = await open(first, root, vault);
    const pending = await work(first, handles.capture, "nextCapture");
    assert.equal(pending.type, "snapshot");
    assert.ok(
      pending.capture.entries.some((e) => e.text === "Local capture evidence"),
    );
    assert.equal(JSON.stringify(pending).includes(vault), false);
    assert.equal((await work(first, handles.manual, "list")).length, 1);
    assert.deepEqual(
      await work(first, handles.capture, "nextCapture"),
      pending,
    );
    await work(first, handles.capture, "confirmCapture", {
      delivery: pending.delivery,
    });
    await work(first, handles.capture, "confirmCapture", {
      delivery: pending.delivery,
    });
    assert.equal(
      (await work(first, handles.capture, "nextCapture")).type,
      "idle",
    );
    appendFileSync(
      source,
      `${JSON.stringify({ ...message, payload: { ...message.payload, content: [{ type: "input_text", text: "Next immutable observation" }] } })}\n`,
    );
    const changed = await work(first, handles.capture, "nextCapture");
    assert.equal(changed.type, "snapshot");
    assert.ok(
      changed.capture.entries.some(
        (e) => e.text === "Next immutable observation",
      ),
    );
    assert.notEqual(
      changed.capture.source.snapshotKey,
      pending.capture.source.snapshotKey,
    );
    await work(first, handles.capture, "confirmCapture", {
      delivery: pending.delivery,
    });
    assert.deepEqual(
      await work(first, handles.capture, "nextCapture"),
      changed,
    );
    await request(first, { type: "close", handle: handles.capture });
    assert.equal((await work(first, handles.manual, "list")).length, 1);
    assert.ok((await invoke(first, "plugin:lapis-ai|list")).failure);
    assert.equal(
      (await invoke(first, "vault_close", { sessionId: handles.sessionId }))
        .failure,
      null,
    );
    assert.ok(
      (
        await invoke(first, "desktop_ai_imports", {
          request: { type: "prepare", handle: handles.manual },
        })
      ).failure,
    );
    await first.close(true);
    const exact = readFileSync(source, "utf8");
    const cold = await nativeSession(
      "capture-source-cold",
      root,
      undefined,
      [],
      { background: true },
    );
    context.after(cold.cleanup);
    const restored = await open(cold, root, vault);
    const observation = await work(cold, restored.capture, "nextCapture");
    assert.deepEqual(observation.capture, changed.capture);
    assert.notEqual(observation.delivery, changed.delivery);
    assert.ok((await invoke(cold, "plugin:lapis-ai|list")).failure);
    await request(cold, { type: "close", handle: restored.capture });
    await request(cold, { type: "close", handle: restored.manual });
    await cold.close(true);
    assert.equal(readFileSync(source, "utf8"), exact);
    assert.equal(readFileSync(join(vault, "Keep.md"), "utf8"), "# Preserved\n");
    assert.equal(existsSync(join(vault, ".jj")), false);
    assert.equal(existsSync(join(root, "acp-peer.jsonl")), false);
    console.log(`Native capture source evidence: ${root}`);
  },
);
