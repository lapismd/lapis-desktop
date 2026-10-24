import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { nativeSession } from "./native-session.mjs";
import { createNativeDatabaseProvider } from "../../src/lib/native/database/native-database-provider.ts";

test("retained Search provider invalidates native SQL vectors atomically and survives reopen without showing a window", async (context) => {
  mkdirSync(".local/native-test", { recursive: true });
  const root = mkdtempSync(resolve(".local/native-test/search-provider-"));
  const vault = join(root, "Search café 笔记");
  mkdirSync(vault);
  const session = await nativeSession("search-provider", root, undefined, [], {
    background: true,
  });
  context.after(() => session.cleanup());
  const call = async (command, args = {}) => {
    const reply = await session.browser.execute(
      async (command, args) => {
        try {
          return {
            value: await globalThis.__TAURI__.core.invoke(command, args),
          };
        } catch (error) {
          return { failure: { message: String(error?.message ?? error) } };
        }
      },
      command,
      args,
    );
    if (reply.failure) throw new Error(reply.failure.message);
    return reply.value;
  };
  const quiet = async () => {
    const shell = await call("shell_info");
    assert.equal(shell.backgroundApi, true);
    assert.equal(shell.nativeVisibility.Ok[0], false);
    assert.equal(shell.nativeVisibility.Ok[4], false);
    assert.equal(
      await session.browser.execute(() => document.hasFocus()),
      false,
    );
  };
  await quiet();
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  const selected = await call("vault_select", { createName: null });
  const provider = createNativeDatabaseProvider(selected, call);
  const open = () =>
    provider.open({
      vaultId: selected.profileId,
      runtime: "tauri-desktop",
      role: "direct",
    });
  let database = await open();
  assert.equal(database.descriptor.engine, "turso");
  assert.equal(database.descriptor.providerId, "turso-native-desktop");
  assert.equal(database.descriptor.transport, "native");
  const initial = { kind: "token-hash", modelId: "original", dimensions: 12 };
  const replacement = { ...initial, modelId: "replacement", dimensions: 24 };
  try {
    await database.configureSearchEmbeddingProvider(initial);
    await database.upsertSearchDocument({
      path: "Note.md",
      name: "Note",
      extension: "md",
      checksum: "one",
      content: "A cat on a window.",
      tags: [],
      tagParts: [],
      tagHierarchy: [],
      chunks: [
        {
          id: "Note.md#0",
          text: "A cat on a window.",
          startOffset: 0,
          endOffset: 18,
        },
      ],
    });
    assert.equal(
      (await database.getSearchDocument("Note.md")).chunks[0].embedding.status,
      "ready",
    );
    const revision = await database.getChangeRevision();
    await database.configureSearchEmbeddingProvider(replacement);
    assert.deepEqual(
      (await database.getSearchDocument("Note.md")).chunks[0].embedding,
      {
        status: "pending",
        modelId: "replacement",
        modelVersion: "0",
        dimensions: 24,
        dirty: true,
      },
    );
    const stats = await database.getSearchIndexStats();
    assert.equal(stats.readyChunkCount, 0);
    assert.equal(stats.pendingChunkCount, 1);
    assert.equal(stats.errorChunkCount, 0);
    assert.equal(await database.getChangeRevision(), revision + 1);
    await database.configureSearchEmbeddingProvider(replacement);
    assert.equal(await database.getChangeRevision(), revision + 1);
    await database.close();
    database = await open();
    assert.deepEqual(await database.getSearchEmbeddingProvider(), replacement);
    assert.equal(
      (await database.getSearchDocument("Note.md")).chunks[0].embedding.status,
      "pending",
    );
    await quiet();
  } finally {
    await database.close();
  }
  await call("vault_close", { sessionId: selected.sessionId });
  await session.close();
});
