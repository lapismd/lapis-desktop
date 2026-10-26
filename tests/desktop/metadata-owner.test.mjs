import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  renameSync,
  rmSync,
  rmdirSync,
  readdirSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { nativeSession } from "./native-session.mjs";
import { createNativeDatabaseProvider } from "../../src/lib/native/database/native-database-provider.ts";

async function fixture(context, owner) {
  const previous = process.env.LAPIS_DESKTOP_METADATA_OWNER;
  if (owner === undefined) delete process.env.LAPIS_DESKTOP_METADATA_OWNER;
  else process.env.LAPIS_DESKTOP_METADATA_OWNER = owner;
  context.after(() => {
    if (previous === undefined) delete process.env.LAPIS_DESKTOP_METADATA_OWNER;
    else process.env.LAPIS_DESKTOP_METADATA_OWNER = previous;
  });
  mkdirSync(".local/native-test", { recursive: true });
  const root = mkdtempSync(resolve(".local/native-test/metadata-owner-"));
  const vault = join(root, "Metadata café 笔记");
  mkdirSync(vault);
  writeFileSync(join(vault, "Note.md"), "# Initial\n#orchard\n");
  writeFileSync(join(vault, "Other.md"), "# Other\n[[Note]]\n");
  const session = await nativeSession("metadata-owner", root, undefined, [], {
    background: true,
  });
  context.after(session.cleanup);
  const call = async (command, args = {}) => {
    const reply = await session.browser.execute(
      async (command, args) => {
        try {
          return {
            value: await globalThis.__TAURI__.core.invoke(command, args),
          };
        } catch (error) {
          return {
            failure: {
              code: error?.code,
              message: String(error?.message ?? error),
            },
          };
        }
      },
      command,
      args,
    );
    if (reply.failure)
      throw Object.assign(new Error(reply.failure.message), {
        code: reply.failure.code,
      });
    return reply.value;
  };
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  const selected = await call("vault_select", { createName: null });
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
  return { root, vault, session, call, selected, provider, database };
}

async function eventually(read, predicate) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const value = await read();
    if (predicate(value)) return value;
    await delay(25);
  }
  assert.fail("Native metadata did not converge within the original bound");
}

test("renderer metadata remains the default and forged DOM selection cannot grant native controls", async (context) => {
  const f = await fixture(context);
  assert.equal((await f.call("shell_info")).metadataOwner, "renderer");
  await assert.rejects(
    f.provider.backgroundIndexing.call({ kind: "select_metadata" }),
    /not selected/u,
  );
  await f.session.browser.execute(() => {
    document.documentElement.dataset.metadataOwner = "core";
  });
  await assert.rejects(
    f.provider.backgroundIndexing.call({ kind: "select_metadata" }),
    /not selected/u,
  );
  await f.database.close();
  await f.call("vault_close", { sessionId: f.selected.sessionId });
  await f.session.close();
});

test("selected native metadata preserves typed admission, detached reconciliation and cold rebuild", async (context) => {
  const f = await fixture(context, "core");
  const { backgroundIndexing: port } = f.provider;
  const shell = await f.call("shell_info");
  assert.equal(shell.metadataOwner, "core");
  assert.equal(shell.nativeVisibility.Ok[0], false);
  assert.equal(shell.nativeVisibility.Ok[4], false);
  await port.call({ kind: "select_metadata" });
  const processor = await port.call({
    kind: "register_processor",
    owner_plugin_id: "markdown",
    extension: "md",
  });
  assert.equal(processor.contribution.placement, "native");
  const unsupported = await port.call({
    kind: "register_processor",
    owner_plugin_id: "custom",
    extension: "other",
  });
  assert.equal(unsupported.contribution.placement, "client_dependent");
  assert.match(unsupported.contribution.message, /requires a client/u);
  await port.call({ kind: "refresh", rebuild: false });
  assert.equal(
    (await f.database.getIndexedFile("Note.md")).metadata.metadata.headings[0]
      .heading,
    "Initial",
  );
  await assert.rejects(
    f.database.deleteIndexedFile("Note.md"),
    /native|owner/u,
  );
  await assert.rejects(
    port.call({ kind: "disable_search" }),
    /Native Search selection is not available/u,
  );
  await assert.rejects(
    port.call({
      kind: "select_search",
      selection: {
        providers: [],
        chunking: {
          targetChars: 1000,
          breakpointWindowChars: 100,
          breakpointDecay: 0.5,
        },
      },
    }),
    /Native Search selection is not available/u,
  );
  const admission = await f.call("vault_db_open", {
    sessionId: f.selected.sessionId,
  });
  await f.call("acp_acceptance_control", { operation: "other-window" });
  await f.session.browser.waitUntil(async () =>
    (await f.session.browser.getWindowHandles()).includes("acp-other"),
  );
  await f.session.browser.switchToWindow("acp-other");
  await f.session.browser.waitUntil(() =>
    f.session.browser.execute(() =>
      Boolean(globalThis.__TAURI__?.core?.invoke),
    ),
  );
  await assert.rejects(
    f.call("vault_indexing", {
      request: {
        sessionId: f.selected.sessionId,
        connectionId: admission.connectionId,
        command: { kind: "status" },
      },
    }),
  );
  await f.session.browser.closeWindow();
  await f.session.browser.switchToWindow("main");
  assert.ok((await port.call({ kind: "status" })).status);
  for (const request of [
    {
      sessionId: "foreign",
      connectionId: admission.connectionId,
      command: { kind: "status" },
    },
    {
      sessionId: f.selected.sessionId,
      connectionId: "unknown",
      command: { kind: "status" },
    },
    {
      sessionId: f.selected.sessionId,
      connectionId: admission.connectionId,
      command: { kind: "status" },
      path: "/outside",
    },
    {
      sessionId: f.selected.sessionId,
      connectionId: admission.connectionId,
      command: { kind: "status", sql: "SELECT 1" },
    },
  ])
    await assert.rejects(f.call("vault_indexing", { request }));
  const revision = await f.database.getChangeRevision();
  await port.call({ kind: "refresh", rebuild: false });
  assert.equal(
    await f.database.getChangeRevision(),
    revision,
    "unchanged metadata must be revision-idempotent",
  );
  await f.database.close();
  await assert.rejects(port.call({ kind: "status" }), /closed/u);
  await assert.rejects(
    f.call("vault_indexing", {
      request: {
        sessionId: f.selected.sessionId,
        connectionId: admission.connectionId,
        command: { kind: "status" },
      },
    }),
  );
  const changed = "# Changed after detach\n#fruit\n";
  writeFileSync(join(f.vault, "Note.md"), changed);
  writeFileSync(join(f.vault, "Created.md"), "# Created after detach\n");
  renameSync(join(f.vault, "Other.md"), join(f.vault, "Renamed.md"));
  const reopenedProvider = createNativeDatabaseProvider(
    f.selected,
    f.call,
    () => undefined,
    "core",
  );
  const reopened = await reopenedProvider.open({
    vaultId: f.selected.profileId,
    runtime: "tauri-desktop",
    role: "direct",
  });
  // Reads do not select or refresh the owner after the original client detached.
  await eventually(
    () => reopened.getIndexedFile("Note.md"),
    (row) =>
      row?.metadata?.metadata.headings[0]?.heading === "Changed after detach",
  );
  await eventually(
    () => reopened.getIndexedFile("Created.md"),
    (row) => !!row?.metadata,
  );
  await eventually(
    () => reopened.getIndexedFile("Renamed.md"),
    (row) => !!row?.metadata,
  );
  await eventually(
    () => reopened.getIndexedFile("Other.md"),
    (row) => !row,
  );
  rmSync(join(f.vault, "Created.md"));
  await eventually(
    () => reopened.getIndexedFile("Created.md"),
    (row) => !row,
  );
  const retired = f.vault + ".retired";
  renameSync(f.vault, retired);
  mkdirSync(f.vault);
  await assert.rejects(
    reopenedProvider.backgroundIndexing.call({ kind: "status" }),
  );
  assert.deepEqual(readdirSync(f.vault), []);
  rmdirSync(f.vault);
  renameSync(retired, f.vault);
  await reopened.close();
  await f.call("vault_close", { sessionId: f.selected.sessionId });
  await f.session.close();
  assert.equal(readFileSync(join(f.vault, "Note.md"), "utf8"), changed);
  const cold = await nativeSession(
    "metadata-owner-cold",
    f.root,
    undefined,
    [],
    { background: true },
  );
  context.after(cold.cleanup);
  const coldCall = async (command, args = {}) =>
    cold.browser.execute(
      (command, args) => globalThis.__TAURI__.core.invoke(command, args),
      command,
      args,
    );
  const selected = await coldCall("vault_open_recent", {
    profileId: f.selected.profileId,
  });
  const coldProvider = createNativeDatabaseProvider(
    selected,
    coldCall,
    () => undefined,
    "core",
  );
  const database = await coldProvider.open({
    vaultId: selected.profileId,
    runtime: "tauri-desktop",
    role: "direct",
  });
  assert.equal(
    (await database.getIndexedFile("Note.md")).metadata.metadata.headings[0]
      .heading,
    "Changed after detach",
  );
  await coldProvider.backgroundIndexing.call({ kind: "select_metadata" });
  await coldProvider.backgroundIndexing.call({
    kind: "refresh",
    rebuild: true,
  });
  assert.equal(
    (await database.getIndexedFile("Note.md")).metadata.metadata.headings[0]
      .heading,
    "Changed after detach",
  );
  await database.close();
  await coldCall("vault_close", { sessionId: selected.sessionId });
  await cold.close();
});
