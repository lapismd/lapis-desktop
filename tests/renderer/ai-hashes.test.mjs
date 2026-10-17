import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  canonicalConversationJson,
  sha256ConversationText,
  transcriptEntryHash,
  transcriptRangeHash,
} from "../../src/lib/ai/conversations/hashes.ts";
const fixture = JSON.parse(
  readFileSync(
    new URL("../fixtures/ai/retained-transcript.json", import.meta.url),
    "utf8",
  ),
);

test("retained transcript entries preserve their established UTF-8 hashes and order", async () => {
  assert.deepEqual(
    await Promise.all(fixture.entries.map(transcriptEntryHash)),
    fixture.hashes,
  );
  assert.equal(await transcriptRangeHash(fixture.entries), fixture.rangeHash);
  assert.notEqual(
    await transcriptRangeHash([...fixture.entries].reverse()),
    fixture.rangeHash,
  );
  assert.equal(fixture.entries[1].source.sessionId, "old-controller-session");
});

test("canonical conversation JSON sorts object keys and omits undefined fields", () => {
  assert.equal(
    canonicalConversationJson({
      z: [3, { y: 2, a: 1 }],
      a: "café",
      absent: undefined,
    }),
    '{"a":"café","z":[3,{"a":1,"y":2}]}',
  );
});

test("hashing never normalizes or rewrites authored Unicode bytes", async () => {
  assert.notEqual(
    await sha256ConversationText("café"),
    await sha256ConversationText("cafe\u0301"),
  );
});

test("invalid JSON numbers and executable values cannot enter transcript hashes", () => {
  for (const value of [NaN, Infinity, () => {}])
    assert.throws(() => canonicalConversationJson(value), /Cannot hash/);
});
