import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { nativeSession } from "./native-session.mjs";

test("cold native memory persists Markdown, respects edits, and moves without replacing destinations", async (context) => {
  const directory = resolve(".local/native-test");
  mkdirSync(directory, { recursive: true });
  const root = mkdtempSync(join(directory, "memory-"));
  const vault = join(root, "Memory proof café");
  mkdirSync(vault);
  writeFileSync(join(vault, "Welcome.md"), "# Welcome\n");
  async function start(name, restored = false) {
    const session = await nativeSession(name, root, undefined, [], {
      background: true,
    });
    context.after(session.cleanup);
    if (!restored) {
      writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
      await session.browser.$("button*=Open Vault").click();
    }
    try {
      await session.browser.$('[data-notes-ready="true"]').waitForDisplayed();
    } catch (error) {
      writeFileSync(
        join(root, `${name}-startup.txt`),
        await session.browser.execute(() => document.body.innerText),
      );
      throw error;
    }
    await session.browser.execute(
      (path) => globalThis.__lapisMemoryAcceptance.open(path),
      vault,
    );
    return session;
  }
  let session = await start("memory-first");
  const notes = await session.browser.execute(() =>
    globalThis.__lapisMemoryAcceptance.add(),
  );
  assert.equal(notes.length, 1);
  assert.match(
    readFileSync(join(vault, "Memory/MEMORY.md"), "utf8"),
    /compact headings/,
  );
  const current = join(vault, "Memory/MEMORY.md");
  writeFileSync(
    current,
    readFileSync(current, "utf8").replace(
      "compact headings",
      "compact headings and short sentences",
    ),
  );
  const edited = await session.browser.execute(() =>
    globalThis.__lapisMemoryAcceptance.inspect(),
  );
  assert.match(edited.recalled[0].content, /short sentences/);
  mkdirSync(join(vault, "Collision"));
  const collision = await session.browser.execute(() =>
    globalThis.__lapisMemoryAcceptance.move("Collision"),
  );
  assert.equal(collision.ok, false);
  assert.equal(existsSync(current), true);
  assert.deepEqual(
    await session.browser.execute(() =>
      globalThis.__lapisMemoryAcceptance.move("Journal/Memory"),
    ),
    { ok: true },
  );
  assert.equal(existsSync(current), false);
  assert.equal(existsSync(join(vault, "Journal/Memory/MEMORY.md")), true);
  await session.browser.execute(() =>
    globalThis.__lapisMemoryAcceptance.close(),
  );
  await session.close();
  session = await start("memory-restarted", true);
  const reopened = await session.browser.execute(() =>
    globalThis.__lapisMemoryAcceptance.inspect(),
  );
  assert.equal(reopened.folder, "Journal/Memory");
  assert.match(reopened.recalled[0].content, /short sentences/);
  await session.browser.execute(() =>
    globalThis.__lapisMemoryAcceptance.close(),
  );
  await session.close();
});
