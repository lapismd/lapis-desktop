import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { nativeSession } from "./native-session.mjs";

function records(path, file) {
  return readFileSync(join(path, file), "utf8")
    .trim()
    .split("\n")
    .map(JSON.parse);
}
async function open(session, id) {
  const info = await session.browser.execute(async (id) => {
    const api = globalThis.__lapisAcpAcceptance;
    const info = await api.raw.open({
      requestId: id,
      targetId: "compiled-capture-fixture",
    });
    await api.reconnect(id, info, 0);
    await api.send(id, `configure-${id}`, { type: "configure", mode: "ask" });
    return info;
  }, id);
  return info;
}
test("cold native capture preserves deferred text groups and withholds unknown receipts without replay", async (context) => {
  const path = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "native-batches-"),
  );
  const session = await nativeSession("acp-batches", path);
  context.after(session.cleanup);
  const info = await open(session, "captured");
  const terminal = await session.browser.execute(() =>
    globalThis.__lapisAcpAcceptance.send("captured", "success-once", {
      type: "prompt",
      text: "batch: success",
      context: null,
      max_duration_ms: 10000,
    }),
  );
  assert.equal(terminal.record.status, "completed");
  assert.equal(terminal.assistantText, "A [captured] answer");
  const display = await session.browser.execute(() =>
    globalThis.__lapisAcpAcceptance.frames("captured"),
  );
  const text = display
    .filter(
      (f) =>
        f.type === "activity" &&
        f.update?.sessionUpdate === "agent_message_chunk",
    )
    .map((f) => f.update.content.text)
    .join("");
  assert.equal(text, "A [captured] answer");
  assert.equal(
    JSON.stringify(display).includes("fixture-native-secret"),
    false,
  );
  const captures = records(path, `capture-${info.sessionId}.jsonl`);
  const final = captures.findLast((c) => c.frames.at(-1).type === "record");
  assert.equal(final.frames.length, 2);
  assert.equal(final.frames[0].update.content.text, "A [captured] answer");
  assert.equal(final.binding.worker, info.sessionId);
  assert.equal(final.binding.request, "captured");
  assert.equal(
    JSON.stringify(captures).includes("fixture-native-secret"),
    false,
  );
  const snapshots = await session.browser.execute(() =>
    globalThis.__lapisAcpAcceptance.events("captured"),
  );
  const native = snapshots
    .flatMap((s) => s.events)
    .find((e) => e.frame.type === "record");
  assert.equal(native.before.length, 1);
  assert.equal(native.before[0].sequence, undefined);
  const mapped = await session.browser.execute(() =>
    globalThis.__lapisAcpAcceptance.mapped("captured"),
  );
  const answers = mapped.filter((event) => event.type === "text");
  const answer = answers.at(-1);
  const complete = mapped.find((event) => event.type === "completed");
  assert.equal(
    answers.map((event) => event.text).join(""),
    "A [captured] answer",
  );
  assert.equal(answer.source.frameIndex, 0);
  assert.equal(complete.source.frameIndex, 1);
  assert.equal(answer.source.sequence, complete.source.sequence);
  assert.equal(answer.source.sessionId, info.sessionId);
  assert.equal(JSON.stringify(mapped).includes("fixture-native-secret"), false);
  await session.browser.execute(() =>
    globalThis.__lapisAcpAcceptance.close("captured"),
  );

  const unknown = await open(session, "unknown");
  writeFileSync(join(path, "withhold-terminal-receipt"), "fixture\n");
  const result = await session.browser.execute(async () => {
    try {
      await globalThis.__lapisAcpAcceptance.send("unknown", "unknown-once", {
        type: "prompt",
        text: "batch: unknown",
        context: null,
        max_duration_ms: 10000,
      });
      return { unexpected: true };
    } catch (error) {
      return { code: error.code, outcome: error.outcome };
    }
  });
  assert.equal(result.outcome, "unknown");
  const state = await session.browser.execute(
    (id) =>
      globalThis.__lapisAcpAcceptance.raw.snapshot(
        id,
        globalThis.__lapisAcpAcceptance.events("unknown").at(-1)?.sequence ?? 0,
      ),
    unknown.sessionId,
  );
  assert.equal(state.closed, true);
  assert.equal(state.failure, "native_capture_unknown");
  assert.deepEqual(state.unresolvedRequests, ["unknown-once"]);
  const hidden = await session.browser.execute(() =>
    globalThis.__lapisAcpAcceptance.frames("unknown"),
  );
  const hiddenMapped = await session.browser.execute(() =>
    globalThis.__lapisAcpAcceptance.mapped("unknown"),
  );
  assert.equal(
    hiddenMapped
      .filter((event) => event.type === "text")
      .map((event) => event.text)
      .join(""),
    "",
  );
  assert.equal(
    hiddenMapped.some((event) => event.type === "completed"),
    false,
  );
  assert.equal(
    JSON.stringify(hiddenMapped).includes("fixture-native-secret"),
    false,
  );
  assert.equal(
    hidden.some((f) => f.type === "record"),
    false,
  );
  assert.equal(
    hidden.some((f) => f.update?.content?.text === "A [captured] answer"),
    false,
  );
  const retained = records(path, `capture-${unknown.sessionId}.jsonl`).findLast(
    (c) => c.frames.at(-1).type === "record",
  );
  assert.equal(retained.frames[0].update.content.text, "A [captured] answer");
  const prompts = records(path, "acp-peer.jsonl").filter(
    (r) => r.method === "session/prompt",
  );
  assert.equal(prompts.length, 2);
  assert.equal(
    prompts.filter((r) => r.params.prompt.at(-1).text === "batch: unknown")
      .length,
    1,
  );
  await session.close();
  for (const { pid } of records(path, "acp-peer.jsonl").filter((r) => r.pid)) {
    assert.throws(() => process.kill(pid, 0), { code: "ESRCH" });
  }
});
