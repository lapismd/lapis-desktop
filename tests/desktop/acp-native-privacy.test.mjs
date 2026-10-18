import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { nativeSession } from "./native-session.mjs";

test("cold native capture applies the real admitted path and credential policy before renderer delivery", async (context) => {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "native-privacy-"),
  );
  const session = await nativeSession("acp-native-privacy", root);
  context.after(session.cleanup);
  const info = await session.browser.execute(async () => {
    const api = globalThis.__lapisAcpAcceptance;
    const info = await api.raw.open({
      requestId: "native-privacy",
      targetId: "compiled-native-privacy-fixture",
    });
    await api.reconnect("native-privacy", info, 0);
    await api.send("native-privacy", "configure-private", {
      type: "configure",
      mode: "ask",
    });
    return info;
  });
  const terminal = await session.browser.execute(() =>
    globalThis.__lapisAcpAcceptance.send("native-privacy", "private-turn", {
      type: "prompt",
      text: "privacy: native policy",
      context: null,
      max_duration_ms: 10000,
    }),
  );
  assert.equal(terminal.record.status, "completed");
  assert.equal(
    terminal.assistantText,
    "See $WORKSPACE/note.md $SECRET [REDACTED]",
  );
  const mapped = await session.browser.execute(() =>
    globalThis.__lapisAcpAcceptance.mapped("native-privacy"),
  );
  assert.equal(
    mapped
      .filter((event) => event.type === "text")
      .map((event) => event.text)
      .join(""),
    "See $WORKSPACE/note.md $SECRET [REDACTED]",
  );
  assert.equal(mapped.filter((event) => event.type === "completed").length, 1);
  assert.equal(JSON.stringify(mapped).includes("fixture-native-secret"), false);
  const values = readFileSync(
    join(root, `capture-${info.sessionId}.jsonl`),
    "utf8",
  )
    .trim()
    .split("\n")
    .map(JSON.parse);
  assert.ok(values.length > 3);
  assert.ok(
    values.every(
      (value) =>
        value.policy ===
        "kingfisher-scanner@1.4.0/builtin-medium/transcript-paths/v1",
    ),
  );
  assert.ok(values.every((value) => value.binding.worker === info.sessionId));
  assert.ok(
    values.every((value) => value.binding.request === "native-privacy"),
  );
  assert.equal(JSON.stringify(values).includes("fixture-native-secret"), false);
  assert.equal(JSON.stringify(values).includes(root), false);
  assert.equal(
    JSON.stringify(values).includes(`ghp_${"NQLObn7M3OTKBL44TH6K9WxFY39LZM1sDc0K"}`),
    false,
  );
  await session.browser.execute(() =>
    globalThis.__lapisAcpAcceptance.close("native-privacy"),
  );
  await session.close();
  const peers = readFileSync(join(root, "acp-peer.jsonl"), "utf8")
    .trim()
    .split("\n")
    .map(JSON.parse);
  assert.equal(
    peers.filter((peer) => peer.method === "session/prompt").length,
    1,
  );
  for (const { pid } of peers.filter((peer) => peer.pid))
    assert.throws(() => process.kill(pid, 0), { code: "ESRCH" });
});
