import test from "node:test";
import assert from "node:assert/strict";
import { createNativeRepository } from "../../src/lib/native/repository/services.ts";

const vault = {
  sessionId: "opaque-session",
  profileId: "99cf7c48-b745-4d48-acd5-125bb398674c",
  name: "Notes",
  path: "/not-renderer-authority",
};
const operation = "ab".repeat(64);
const repository = "cd".repeat(16);
const heads = `{"version":1,"data":{"version":1,"profile":"local","repository":"${repository}","generation":18446744073709551615,"heads":["${operation}"]}}`;

test("managed and Original SDK reads use one admitted Core bridge without parsing lossless frames", async (context) => {
  const calls = [];
  const service = createNativeRepository(vault, async (command, args) => {
    calls.push([command, args]);
    if (
      command === "desktop_repository_admit" ||
      command === "desktop_repository_release"
    )
      return;
    if (command === "desktop_repository_sources")
      return { original: true, token: "original:scope" };
    if (command === "desktop_repository_read") return heads;
    throw new Error(`Unexpected native command: ${command}`);
  });
  context.after(() => service.close("close"));
  assert.equal(
    (await service.reader.heads()).generation,
    18446744073709551615n,
  );
  assert.equal(
    (await service.original.heads()).generation,
    18446744073709551615n,
  );
  const reads = calls.filter(([name]) => name === "desktop_repository_read");
  assert.equal(reads.length, 2);
  assert.deepEqual(
    reads.map(([, args]) => JSON.parse(args.request.frame).data.vault),
    [vault.profileId, "original:scope"],
  );
  for (const [, args] of reads) {
    assert.deepEqual(Object.keys(args.request).sort(), [
      "frame",
      "method",
      "sessionId",
    ]);
    assert.equal(args.request.sessionId, vault.sessionId);
    assert.equal(args.request.method, "heads");
    assert.equal(typeof args.request.frame, "string");
  }
  assert.equal(
    calls.some(([name]) => name.startsWith("plugin:")),
    false,
  );
});

test("Core query diagnostics remain structured and lost read outcomes never replay or fall back", async (context) => {
  const diagnostic = {
    kind: "invalid_query",
    data: { message: "Unknown revset symbol", span: { start: 3, end: 9 } },
  };
  let reads = 0;
  const service = createNativeRepository(vault, async (command) => {
    if (
      command === "desktop_repository_admit" ||
      command === "desktop_repository_release"
    )
      return;
    if (command === "desktop_repository_read") {
      reads++;
      throw {
        code: "EINVAL",
        message: "Native query rejected",
        history: diagnostic,
      };
    }
    throw new Error(`Unexpected native command: ${command}`);
  });
  context.after(() => service.close("close"));
  const error = await service.reader
    .read("db7db7c3-cd2d-47e5-aa11-7d9edbeae814", { kind: "query_info" })
    .catch((error) => error);
  assert.ok(error instanceof Error);
  assert.equal(error.message, "Native query rejected");
  assert.equal(error.code, "EINVAL");
  assert.deepEqual(error.history, diagnostic);
  assert.equal(reads, 1);
});
