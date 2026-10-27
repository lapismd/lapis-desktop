import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, join, resolve } from "node:path";
import { createNativeDatabaseProvider } from "../../src/lib/native/database/native-database-provider.ts";
import { nativeSession } from "./native-session.mjs";

const referencePath = resolve(
  "../lapis-notes/packages/api/src/lib/__tests__/fixtures/search-semantic-model.json",
);
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const runtime = {
  name: "libonnxruntime.1.30.0.dylib",
  bytes: 44589928,
  sha256: "685d2be5dba1309c89d3a5324b7fd06a5c42f1a61bfea32d14c4cc28d072121d",
};

// Model preparation can outlive a WebDriver HTTP request. Forward the same
// admitted invocation and observe its actual completion in later short reads.
function acceptedCall(browser) {
  return async (command, args = {}) => {
    const id = randomUUID();
    await browser.execute(
      (id, command, args) => {
        globalThis.__lapisOnnxCalls ??= {};
        globalThis.__lapisOnnxCalls[id] = { done: false };
        void globalThis.__TAURI__.core.invoke(command, args).then(
          (value) => {
            globalThis.__lapisOnnxCalls[id] = { done: true, value };
          },
          (error) => {
            globalThis.__lapisOnnxCalls[id] = {
              done: true,
              failure: String(error?.message ?? error),
            };
          },
        );
        return true;
      },
      id,
      command,
      args,
    );
    await browser.waitUntil(
      () => browser.execute((id) => globalThis.__lapisOnnxCalls[id].done, id),
      { timeout: 180000, interval: 50 },
    );
    const reply = await browser.execute((id) => {
      const reply = globalThis.__lapisOnnxCalls[id];
      delete globalThis.__lapisOnnxCalls[id];
      return reply;
    }, id);
    if (reply.failure) throw new Error(reply.failure);
    return reply.value;
  };
}

async function admission(context, name, root, vault) {
  const session = await nativeSession(name, root, undefined, [], {
    background: true,
  });
  context.after(session.cleanup);
  const call = acceptedCall(session.browser);
  const shell = await call("shell_info");
  assert.equal(shell.backgroundApi, true);
  assert.equal(shell.nativeVisibility.Ok[0], false);
  assert.equal(shell.nativeVisibility.Ok[4], false);
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  const selected = await call("vault_select", { createName: null });
  const provider = createNativeDatabaseProvider(
    selected,
    call,
    () => undefined,
  );
  const open = () =>
    provider.open({
      vaultId: selected.profileId,
      runtime: "tauri-desktop",
      role: "direct",
    });
  return { session, call, selected, open };
}

function document(index, text) {
  return {
    path: `${index}.md`,
    name: `Record ${index}`,
    extension: "md",
    checksum: "retained-model-reference",
    content: text,
    tags: [],
    tagParts: [],
    tagHierarchy: [],
    chunks: [
      { id: `${index}.md#0`, text, startOffset: 0, endOffset: text.length },
    ],
  };
}

async function vectors(database, fixture) {
  for (const [index, row] of fixture.queries.entries()) {
    const record = await database.getSearchDocument(`${index}.md`);
    const embedding = record.chunks[0].embedding;
    assert.equal(embedding.status, "ready");
    assert.equal(embedding.modelId, fixture.modelId);
    assert.equal(embedding.dimensions, 384);
    assert.equal(embedding.vector.length, 384);
    assert.equal(embedding.fingerprint, fixture.chunks[index].fingerprint);
    for (const [dimension, expected] of row.vector.entries())
      assert.ok(
        Math.abs(embedding.vector[dimension] - expected) < 0.00001,
        `Retained macOS model vector ${index}, dimension ${dimension}`,
      );
  }
  assert.equal((await database.getSearchIndexStats()).readyChunkCount, 6);
}

async function ranks(database, fixture) {
  const revision = await database.getChangeRevision();
  for (const row of fixture.queries) {
    const expected = fixture.queries
      .map((document, index) => ({
        path: `${index}.md`,
        score: document.vector.reduce(
          (score, value, dimension) => score + value * row.vector[dimension],
          0,
        ),
      }))
      .filter(({ score }) => score >= 0.2)
      .sort((left, right) => right.score - left.score);
    const results = await database.searchDocuments(row.text, {
      mode: "vector",
      includeDiagnostics: true,
    });
    assert.deepEqual(
      results.map((result) => result.document.path),
      expected.map((result) => result.path),
    );
    for (const [index, result] of results.entries()) {
      assert.ok(
        Math.abs(result.scoreBreakdown.vector - expected[index].score) < 0.0002,
        "Actual model query retains the qualified score tolerance",
      );
      assert.equal(result.diagnostics.providerKind, "transformers-js");
      assert.equal(result.diagnostics.appliedMode, "vector");
      assert.equal(result.diagnostics.vectorCandidateCount, expected.length);
      assert.deepEqual(result.matchedChunkIds, [result.document.path + "#0"]);
      assert.ok(result.snippets.length);
    }
  }
  assert.equal(await database.getChangeRevision(), revision);
}

function assets(root, fixture) {
  const directory = join(root, "profile", "models");
  const retained = [...fixture.assets, { ...runtime, file: runtime.name }];
  return retained.map((asset) => {
    const file = `${asset.sha256}-${basename(asset.file)}`;
    const bytes = readFileSync(join(directory, file));
    assert.equal(bytes.length, asset.bytes);
    assert.equal(digest(bytes), asset.sha256);
    return [file, asset.sha256];
  });
}

test(
  "actual native ONNX provider retains qualified vectors and ranks through detach and cold offline reopen",
  { timeout: 240000 },
  async (context) => {
    assert.equal(process.platform, "darwin");
    assert.equal(process.arch, "arm64");
    const bytes = readFileSync(referencePath);
    assert.equal(
      digest(bytes),
      "fc735637f05dfd8aebce2ea75e1f5704f37248c4404ab40ef0117ded0dfcc133",
      "The source-owned retained macOS reference must stay exact",
    );
    const fixture = JSON.parse(bytes);
    const parent = resolve(
      process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT ?? ".local/native-test",
    );
    mkdirSync(parent, { recursive: true });
    const root = mkdtempSync(join(parent, "search-onnx-"));
    const vault = join(root, "Semantic Search 笔记");
    mkdirSync(vault);
    const first = await admission(context, "search-onnx", root, vault);
    let database = await first.open();
    assert.equal(await database.getSearchEmbeddingProvider(), null);
    assert.deepEqual(readdirSync(join(root, "profile", "models")), []);
    const configuration = {
      kind: "transformers-js",
      modelId: fixture.modelId,
      revision: fixture.revision,
      dtype: fixture.dtype,
      dimensions: 384,
      normalize: true,
      allowRemoteModels: true,
    };
    await database.configureSearchEmbeddingProvider(configuration);
    for (const [index, row] of fixture.queries.entries())
      await database.upsertSearchDocument(document(index, row.text));
    await vectors(database, fixture);
    await ranks(database, fixture);
    const installed = assets(root, fixture);
    assert.equal(statSync(join(root, "profile", "models")).isDirectory(), true);
    await database.close();
    database = await first.open();
    await vectors(database, fixture);
    const offline = { ...configuration, allowRemoteModels: false };
    await database.configureSearchEmbeddingProvider(offline);
    for (const [index, row] of fixture.queries.entries())
      await database.upsertSearchDocument(document(index, row.text));
    await ranks(database, fixture);
    await database.close();
    await first.call("vault_close", { sessionId: first.selected.sessionId });
    await first.session.close();
    const cold = await admission(context, "search-onnx-cold", root, vault);
    database = await cold.open();
    assert.deepEqual(await database.getSearchEmbeddingProvider(), offline);
    await vectors(database, fixture);
    await ranks(database, fixture);
    assert.deepEqual(assets(root, fixture), installed);
    assert.deepEqual(
      readdirSync(vault),
      [],
      "Model/cache state stays outside vault bytes",
    );
    await database.close();
    await cold.call("vault_close", { sessionId: cold.selected.sessionId });
    await cold.session.close();
  },
);
