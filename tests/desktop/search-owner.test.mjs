import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  renameSync,
  rmSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { nativeSession } from "./native-session.mjs";
import { createNativeDatabaseProvider } from "../../src/lib/native/database/native-database-provider.ts";

const selection = {
  providers: [
    { provider_id: "search:markdown", version: "1", priority: 0 },
    { provider_id: "search:canvas", version: "1", priority: 0 },
  ],
  chunking: {
    targetChars: 1000,
    breakpointWindowChars: 100,
    breakpointDecay: 0.5,
  },
};
async function fixture(context) {
  const previous = process.env.LAPIS_DESKTOP_METADATA_OWNER;
  process.env.LAPIS_DESKTOP_METADATA_OWNER = "core";
  context.after(() => {
    if (previous === undefined) delete process.env.LAPIS_DESKTOP_METADATA_OWNER;
    else process.env.LAPIS_DESKTOP_METADATA_OWNER = previous;
  });
  mkdirSync(".local/native-test", { recursive: true });
  const root = mkdtempSync(resolve(".local/native-test/search-owner-"));
  const vault = join(root, "Native Search café 笔记");
  mkdirSync(vault);
  writeFileSync(join(vault, "Note.md"), "# Native Search\n\norchard oranges\n");
  const session = await nativeSession(
    "search-owner",
    root,
    process.env.LAPIS_DESKTOP_ACCEPTANCE_BINARY,
    [],
    { background: true },
  );
  const databases = [];
  context.after(async () => {
    if (session.isRunning()) {
      for (const database of databases) await database.close().catch(() => {});
    }
    await session.cleanup();
  });
  const call = async (command, args = {}) => {
    const reply = await session.browser.execute(
      async (command, args) => {
        try {
          return {
            value: await globalThis.__TAURI__.core.invoke(command, args),
          };
        } catch (error) {
          return { failure: String(error?.message ?? error) };
        }
      },
      command,
      args,
    );
    if (reply.failure) throw new Error(reply.failure);
    return reply.value;
  };
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  const selected = await call("vault_select", { createName: null });
  const open = async () => {
    const provider = createNativeDatabaseProvider(
      selected,
      call,
      () => undefined,
      "core",
    );
    const database = await provider.open({
      vaultId: selected.profileId,
      runtime: "tauri-desktop",
      role: "direct",
    });
    databases.push(database);
    return { database, port: provider.backgroundIndexing };
  };
  const attachment = await open();
  await attachment.port.call({ kind: "select_metadata" });
  await attachment.port.call({
    kind: "register_processor",
    owner_plugin_id: "markdown",
    extension: "md",
  });
  return { root, vault, selected, session, call, open, ...attachment };
}
async function eventually(read, predicate) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const value = await read();
    if (predicate(value)) return value;
    await delay(25);
  }
  assert.fail("Native Search did not converge within the original bound");
}

test("explicit Core Search owns lexical and semantic indexing across detach and rejects client writers", async (context) => {
  const f = await fixture(context);
  const chosen = await f.port.call({ kind: "select_search", selection });
  assert.equal(chosen.contribution.placement, "native");
  await f.port.call({ kind: "refresh", rebuild: false });
  assert.equal(
    (await f.database.getSearchDocument("Note.md")).sourceProviderId,
    "search:markdown",
  );
  assert.deepEqual(
    (await f.database.searchDocuments("orchard", { mode: "lexical" })).map(
      (hit) => hit.document.path,
    ),
    ["Note.md"],
  );
  await assert.rejects(
    f.database.deleteSearchDocument("Note.md"),
    /native|owner/u,
  );
  await assert.rejects(
    f.database.upsertSearchDocument(
      await f.database.getSearchDocument("Note.md"),
    ),
    /native|owner/u,
  );
  // This control reuses the native embedding actor; it does not publish client rows.
  await f.database.rebuildSearchIndex();
  await f.database.configureSearchEmbeddingProvider({
    kind: "token-hash",
    modelId: "native-owner",
    dimensions: 12,
  });
  await f.port.call({ kind: "refresh", rebuild: true });
  const semantic = await f.database.searchDocuments("orchard oranges", {
    mode: "vector",
  });
  assert.ok(semantic.some((hit) => hit.document.path === "Note.md"));
  assert.equal(semantic[0].retrievalMode, "vector");
  await f.database.close();
  await assert.rejects(f.port.call({ kind: "status" }), /closed/u);
  writeFileSync(join(f.vault, "Created.md"), "# Created\n\norchard pears\n");
  const next = await f.open();
  await eventually(
    () => next.database.searchDocuments("orchard", { mode: "lexical" }),
    (hits) => hits.some((hit) => hit.document.path === "Created.md"),
  );
  renameSync(join(f.vault, "Created.md"), join(f.vault, "Renamed.md"));
  await eventually(
    () => next.database.searchDocuments("orchard", { mode: "lexical" }),
    (hits) =>
      hits.some((hit) => hit.document.path === "Renamed.md") &&
      hits.every((hit) => hit.document.path !== "Created.md"),
  );
  rmSync(join(f.vault, "Renamed.md"));
  await eventually(
    () => next.database.searchDocuments("orchard", { mode: "lexical" }),
    (hits) => hits.length === 1 && hits[0].document.path === "Note.md",
  );
  const unsupported = await next.port.call({
    kind: "select_search",
    selection: {
      ...selection,
      providers: [{ provider_id: "custom:source", version: "1", priority: 0 }],
    },
  });
  assert.equal(unsupported.contribution.placement, "client_dependent");
  assert.match(unsupported.contribution.message, /client/u);
  await next.port.call({ kind: "select_search", selection });
  await next.port.call({ kind: "refresh", rebuild: true });
  await next.port.call({ kind: "disable_search" });
  await next.database.close();
  await f.call("vault_close", { sessionId: f.selected.sessionId });
  await f.session.close();
});
