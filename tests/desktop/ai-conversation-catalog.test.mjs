import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { nativeSession } from "./native-session.mjs";

const id = (n) => n.toString(16).padStart(2, "0").repeat(16);
async function invoke(session, command, args = {}) {
  const ticket = randomUUID();
  await session.browser.execute(
    (ticket, command, args) => {
      globalThis.__canonicalJobs ??= {};
      const jobs = globalThis.__canonicalJobs;
      jobs[ticket] = { pending: true };
      void globalThis.__TAURI__.core.invoke(command, args).then(
        (value) => (jobs[ticket] = { value }),
        (error) =>
          (jobs[ticket] = {
            failure: String(error?.code ?? error?.message ?? error),
          }),
      );
    },
    ticket,
    command,
    args,
  );
  await session.browser.waitUntil(
    () =>
      session.browser.execute(
        (ticket) => !globalThis.__canonicalJobs[ticket].pending,
        ticket,
      ),
    { timeout: 60000, interval: 100 },
  );
  const result = await session.browser.execute((ticket) => {
    const value = globalThis.__canonicalJobs[ticket];
    delete globalThis.__canonicalJobs[ticket];
    return value;
  }, ticket);
  if (result.failure) throw new Error(`${command}: ${result.failure}`);
  return result.value;
}
async function backend(session, vault, operation) {
  const reply = JSON.parse(
    await invoke(session, "desktop_ai_backends", {
      request: JSON.stringify({
        version: 1,
        sessionId: vault.sessionId,
        operation,
      }),
    }),
  );
  assert.equal(reply.version, 1);
  return reply.data;
}
async function admit(session, root, path) {
  writeFileSync(join(root, "picker.json"), JSON.stringify(path));
  const vault = await invoke(session, "vault_select");
  await invoke(session, "desktop_ai_admit", {
    request: { sessionId: vault.sessionId },
  });
  return vault;
}
function jj(path, ...args) {
  return execFileSync("/opt/homebrew/bin/jj", ["--no-pager", ...args], {
    cwd: path,
    encoding: "utf8",
    stdio: "pipe",
    env: {
      ...process.env,
      JJ_CONFIG: "/dev/null",
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_CONFIG_GLOBAL: "/dev/null",
    },
  }).trim();
}
async function launch(context, name, root) {
  const session = await nativeSession(name, root, undefined, [], {
    background: true,
  });
  context.after(session.cleanup);
  return session;
}

test(
  "cold native catalog and canonical read retain source data after private creation records are lost",
  { timeout: 180000 },
  async (context) => {
    const base = resolve(
      process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT ?? ".local/native-test",
    );
    mkdirSync(base, { recursive: true });
    const root = mkdtempSync(join(base, "ai-canonical-catalog-"));
    const path = join(root, "Canonical JJ café");
    mkdirSync(path);
    jj(path, "git", "init", "--no-colocate");
    const note = "# Keep unsnapshotted native source bytes\n";
    writeFileSync(join(path, "Note.md"), note);
    const operation = jj(
      path,
      "--ignore-working-copy",
      "op",
      "log",
      "--limit",
      "1",
      "--no-graph",
      "-T",
      "id",
    );
    const first = await launch(context, "ai-canonical-catalog", root);
    const vault = await admit(first, root, path);
    await backend(first, vault, {
      type: "select",
      requestId: id(1),
      expectedRevision: 0,
      backend: "jj",
    });
    const handle = (
      await backend(first, vault, { type: "open", requestId: id(2) })
    ).data.handle;
    const ref = join(path, ".jj/repo/store/git/refs/lapis/state/v1");
    const empty = JSON.parse(
      (await backend(first, vault, { type: "listConversations", handle })).data,
    );
    assert.deepEqual(empty.conversations, []);
    assert.equal(
      existsSync(ref),
      false,
      "empty discovery must not initialize source metadata",
    );
    const conversation = (
      await backend(first, vault, {
        type: "prepareConversation",
        handle,
        requestId: id(3),
        title: "Canonical native conversation",
      })
    ).data;
    const message = (
      await backend(first, vault, {
        type: "appendConversationMessage",
        handle,
        requestId: id(4),
        conversationRequestId: id(3),
        text: "Native authorship stays in ThreadStore.",
      })
    ).data;
    assert.ok(message.receipt);
    const listing = (
      await backend(first, vault, { type: "listConversations", handle })
    ).data;
    const catalog = JSON.parse(listing);
    assert.equal(catalog.conversations.length, 1);
    assert.equal(
      catalog.conversations[0].target.id,
      conversation.conversationId,
    );
    assert.equal(catalog.conversations[0].threadId, conversation.threadId);
    const encoded = (
      await backend(first, vault, {
        type: "readCanonicalConversation",
        handle,
        threadId: conversation.threadId,
      })
    ).data;
    const snapshot = JSON.parse(encoded);
    assert.equal(snapshot.version, 2);
    assert.equal(
      snapshot.messages[0].body,
      "Native authorship stays in ThreadStore.",
    );
    assert.equal(snapshot.messages[0].message_id, message.messageId);
    assert.deepEqual(snapshot.sessions, []);
    const selected = readFileSync(ref, "utf8");
    await invoke(first, "vault_close", { sessionId: vault.sessionId });
    await first.close(true);

    const profiles = join(root, "profile/ai-backends-v1");
    const names = readdirSync(profiles);
    assert.equal(names.length, 1);
    const privateRecords = join(profiles, names[0], "conversations-v1");
    const privateMessages = join(
      profiles,
      names[0],
      "conversation-messages-v1",
    );
    assert.equal(existsSync(join(privateRecords, "actor.json")), true);
    assert.equal(existsSync(privateMessages), true);
    // Fault injection affects only this test's private recovery cache, after Quit.
    rmSync(privateRecords, { recursive: true });
    rmSync(privateMessages, { recursive: true });

    const cold = await launch(context, "ai-canonical-catalog-reopen", root);
    const reopened = await admit(cold, root, path);
    const owner = (
      await backend(cold, reopened, { type: "open", requestId: id(5) })
    ).data.handle;
    assert.equal(
      (
        await backend(cold, reopened, {
          type: "listConversations",
          handle: owner,
        })
      ).data,
      listing,
    );
    assert.equal(
      (
        await backend(cold, reopened, {
          type: "readCanonicalConversation",
          handle: owner,
          threadId: conversation.threadId,
        })
      ).data,
      encoded,
    );
    const pinned = (
      await backend(cold, reopened, {
        type: "openCanonicalConversationRead",
        handle: owner,
        threadId: conversation.threadId,
      })
    ).data;
    assert.equal(pinned.snapshot, encoded);
    await backend(cold, reopened, {
      type: "closeConversationRead",
      handle: owner,
      readHandle: pinned.handle,
    });
    await assert.rejects(() =>
      backend(cold, reopened, {
        type: "readCanonicalConversation",
        handle,
        threadId: conversation.threadId,
      }),
    );
    assert.equal(
      existsSync(privateRecords),
      false,
      "source reads must not rebuild a private actor or intent",
    );
    assert.equal(existsSync(privateMessages), false);
    assert.deepEqual(await invoke(cold, "plugin:lapis-ai|list"), []);
    assert.equal(readFileSync(ref, "utf8"), selected);
    assert.equal(readFileSync(join(path, "Note.md"), "utf8"), note);
    assert.equal(
      jj(
        path,
        "--ignore-working-copy",
        "op",
        "log",
        "--limit",
        "1",
        "--no-graph",
        "-T",
        "id",
      ),
      operation,
    );
    await invoke(cold, "vault_close", { sessionId: reopened.sessionId });
    await cold.close(true);
    writeFileSync(
      join(root, "canonical-catalog-receipt.json"),
      JSON.stringify(
        {
          conversation,
          selected,
          messageId: message.messageId,
          rows: catalog.conversations.length,
        },
        null,
        2,
      ) + "\n",
    );
  },
);
