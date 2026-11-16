import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { nativeSession } from "./native-session.mjs";
import { createNativeEditingIntents } from "../../src/lib/native/editing/intents.ts";

async function nativeCall(session, command, args = {}) {
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
}

async function fixture(context, owner, parent = resolve(".local/native-test")) {
  const previous = process.env.LAPIS_DESKTOP_EDITING_OWNER;
  if (owner === undefined) delete process.env.LAPIS_DESKTOP_EDITING_OWNER;
  else process.env.LAPIS_DESKTOP_EDITING_OWNER = owner;
  context.after(() => {
    if (previous === undefined) delete process.env.LAPIS_DESKTOP_EDITING_OWNER;
    else process.env.LAPIS_DESKTOP_EDITING_OWNER = previous;
  });
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(join(parent, "editing-owner-"));
  const vault = join(root, "Editing café 笔记");
  mkdirSync(vault);
  writeFileSync(join(vault, "Note.md"), "original");
  const session = await nativeSession("editing-owner", root, undefined, [], {
    background: true,
  });
  context.after(session.cleanup);
  const call = (command, args = {}) => nativeCall(session, command, args);
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  const selected = await call("vault_select");
  return {
    root,
    vault,
    session,
    call,
    selected,
    port: createNativeEditingIntents(selected, call),
  };
}

test("explicit renderer editing cannot gain native controls through forged DOM selection", async (context) => {
  const f = await fixture(context, "renderer");
  assert.equal((await f.call("shell_info")).editingOwner, "renderer");
  await f.session.browser.execute(() => {
    document.documentElement.dataset.editingOwner = "core";
  });
  await assert.rejects(f.port.call({ kind: "list" }), /not selected/);
  await assert.rejects(f.port.read("Note.md"), /not selected/);
  await f.call("vault_close", { sessionId: f.selected.sessionId });
  await f.session.close();
});

test("default native editing retains admitted saves, foreign fences and captured detached recovery", async (context) => {
  const f = await fixture(context);
  const shell = await f.call("shell_info");
  assert.equal(shell.editingOwner, "core");
  assert.equal(shell.nativeVisibility.Ok[0], false);
  assert.equal(shell.nativeVisibility.Ok[4], false);
  assert.equal(
    await f.session.browser.execute(() => document.hasFocus()),
    false,
  );
  const foreign = await f.call("vault_open_recent", {
    profileId: f.selected.profileId,
  });
  const other = createNativeEditingIntents(foreign, f.call);
  const editor_id = crypto.randomUUID();
  const acquired = await f.port.call({
    kind: "acquire",
    editor_id,
    path: "Note.md",
  });
  assert.equal(acquired.kind, "state");
  assert.equal(acquired.state.active, true);
  assert.equal((await f.port.read("Note.md")).text, "original");
  assert.equal(await f.port.read("missing.md"), null);
  await assert.rejects(f.port.read("../outside.md"));
  const save = (selected, data, expected) =>
    f.call("vault_fs", {
      sessionId: selected.sessionId,
      request: {
        operation: "write-text-if-unchanged",
        path: "Note.md",
        data,
        expected,
      },
    });
  await assert.rejects(
    save(foreign, "unsafe", "original"),
    (error) => error.code === "EBUSY",
  );
  await save(f.selected, "saved", "original");
  await f.call("vault_close", {
    sessionId: f.selected.sessionId,
    reload: true,
  });
  await assert.rejects(f.port.call({ kind: "list" }));
  const retained = await other.call({ kind: "list" });
  assert.equal(retained.kind, "states");
  assert.equal(retained.states.length, 1);
  assert.equal(retained.states[0].detached, true);
  await assert.rejects(
    other.call({ kind: "discard", editor_id, generation: 9, revision: 0 }),
  );
  assert.equal((await other.call({ kind: "list" })).states.length, 1);
  await other.call({ kind: "discard", editor_id, generation: 1, revision: 0 });
  assert.deepEqual((await other.call({ kind: "list" })).states, []);
  assert.equal(readFileSync(join(f.vault, "Note.md"), "utf8"), "saved");
  await f.call("vault_close", { sessionId: foreign.sessionId });
  await f.session.close();
});

test("hidden native remotes keep OS tokens scoped and restore them across a cold process", async (context) => {
  // Credential installation metadata must live outside every repository ancestor.
  const f = await fixture(context, undefined, tmpdir());
  let active = f.session;
  let selected = f.selected;
  const label = `remotes-native-${crypto.randomUUID()}`;
  const firstToken = crypto.randomUUID();
  const replacementToken = crypto.randomUUID();
  const remote = (command = null) =>
    nativeCall(active, "desktop_repository_remotes", {
      request: { sessionId: selected.sessionId, command },
    });
  let snapshot = await remote();
  const execute = async (command) => {
    snapshot = await remote({
      ...command,
      expectedRevision: snapshot.revision,
    });
    return snapshot;
  };
  const clean = (value) => {
    const text = JSON.stringify(value);
    assert.ok(
      !text.includes(firstToken),
      "Stored token must not return to the renderer",
    );
    assert.ok(
      !text.includes(replacementToken),
      "Replacement token must not return to the renderer",
    );
  };
  const scanPrivateFiles = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) scanPrivateFiles(path);
      else if (entry.isFile()) {
        const bytes = readFileSync(path);
        assert.ok(
          !bytes.includes(Buffer.from(firstToken)),
          "Token cannot enter profile, vault or logs",
        );
        assert.ok(
          !bytes.includes(Buffer.from(replacementToken)),
          "Replacement cannot enter profile, vault or logs",
        );
      }
    }
  };
  try {
    assert.equal(snapshot.settings.host, "desktop");
    assert.equal(snapshot.settings.storage, "available");
    assert.equal(snapshot.settings.automaticSync, false);
    assert.deepEqual(snapshot.capabilities.targets, ["backup"]);
    await execute({
      kind: "save_credential",
      input: {
        label,
        host: "remotes-custody.invalid",
        username: "native-fixture",
        token: firstToken,
        provider: "https",
      },
    });
    const credential = snapshot.settings.credentials.find(
      (item) => item.label === label,
    );
    assert.ok(
      credential?.available,
      "The OS store must retain the new credential",
    );
    clean(snapshot);
    const connection = {
      name: "origin",
      url: "https://remotes-custody.invalid/vault.git",
      branch: "main",
      bookmark: "lapis-backup",
      authentication: "token",
      credential: credential.id,
    };
    await execute({ kind: "save_connection", target: "backup", connection });
    assert.equal(snapshot.settings.automaticSync, false);
    assert.deepEqual(
      snapshot.settings.targets.find((item) => item.target === "backup")
        .connection,
      connection,
    );
    const beforeRefusal = snapshot.revision;
    await assert.rejects(
      remote({
        kind: "save_connection",
        target: "original",
        connection,
        expectedRevision: snapshot.revision,
      }),
    );
    snapshot = await remote();
    assert.equal(
      snapshot.revision,
      beforeRefusal,
      "An unavailable target cannot mutate backup selection",
    );
    await assert.rejects(
      remote({
        kind: "save_connection",
        target: "backup",
        connection: {
          ...connection,
          url: "https://other-host.invalid/vault.git",
        },
        expectedRevision: snapshot.revision,
      }),
    );
    snapshot = await remote();
    assert.equal(
      snapshot.revision,
      beforeRefusal,
      "Credential scope refusal must not rewrite the approved endpoint",
    );
    await execute({
      kind: "save_credential",
      input: {
        replace: credential.id,
        label,
        host: "remotes-custody.invalid",
        username: "native-fixture",
        token: replacementToken,
        provider: "https",
      },
    });
    assert.equal(
      snapshot.settings.credentials.find((item) => item.label === label).id,
      credential.id,
    );
    clean(snapshot);
    scanPrivateFiles(f.root);
    await f.call("vault_close", { sessionId: selected.sessionId });
    await active.close(true);
    active = await nativeSession(
      "remotes-custody-cold",
      f.root,
      undefined,
      [],
      { background: true },
    );
    context.after(active.cleanup);
    selected = await nativeCall(active, "vault_open_recent", {
      profileId: f.selected.profileId,
    });
    snapshot = await remote();
    assert.equal(snapshot.settings.storage, "available");
    assert.ok(
      snapshot.settings.credentials.find((item) => item.id === credential.id)
        ?.available,
    );
    assert.deepEqual(
      snapshot.settings.targets.find((item) => item.target === "backup")
        .connection,
      connection,
    );
    assert.equal(snapshot.settings.automaticSync, false);
    clean(snapshot);
    scanPrivateFiles(f.root);
    await execute({ kind: "forget_credential", id: credential.id });
    assert.ok(
      !snapshot.settings.credentials.some((item) => item.id === credential.id),
    );
    assert.equal(
      snapshot.settings.targets.find((item) => item.target === "backup").status,
      "credentials-required",
    );
    clean(snapshot);
  } finally {
    // Remove only this case's uniquely labelled OS entry, including assertion failures.
    if (active.isRunning()) {
      snapshot = await remote();
      for (const item of snapshot.settings.credentials.filter(
        (item) => item.label === label,
      ))
        await execute({ kind: "forget_credential", id: item.id });
      await nativeCall(active, "vault_close", {
        sessionId: selected.sessionId,
      });
      await active.close(true);
    }
  }
});
