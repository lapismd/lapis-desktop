import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  copyFileSync,
} from "node:fs";
import { join, resolve, dirname } from "node:path";
import { createHash } from "node:crypto";
import { parse } from "yaml";
import { nativeSession } from "./native-session.mjs";

const configuration = process.env.LAPIS_AI_TEST_RUNTIME_CONFIG;
const executable = resolve(
  "src-tauri/target/debug/bundle/macos/Lapis Notes Acceptance.app/Contents/MacOS/lapis-desktop",
);
const prompt = "Do not use tools. Reply exactly: Original captured answer";
const feedback = "Do not use tools. Reply exactly: COMMENT-CONTEXT-READY";
const entries = (path) =>
  readFileSync(path, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse);
const metadataFiles = (root) =>
  readdirSync(root, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? metadataFiles(join(root, entry.name))
      : entry.name === "metadata.yaml"
        ? [join(root, entry.name)]
        : [],
  );
const hash = (path) =>
  createHash("sha256").update(readFileSync(path)).digest("hex");
async function ready(session) {
  await session.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  if (!(await session.browser.$('[data-testid="ai-chat-panel"]').isDisplayed()))
    await session.browser.$('button[aria-label="Open Chat"]').click();
  await session.browser
    .$(
      '[data-testid="ai-chat-panel"][data-initializing="false"][data-model-catalog-loading="false"]',
    )
    .waitForDisplayed({ timeout: 45_000 });
}
async function completed(session, metadata, predicate) {
  await session.browser.waitUntil(
    () => {
      try {
        const state = parse(readFileSync(metadata, "utf8"));
        const transcript = entries(join(dirname(metadata), "transcript.jsonl"));
        return !state.pendingTurn && predicate(transcript);
      } catch {
        return false;
      }
    },
    { timeout: 90_000, interval: 100 },
  );
}

test(
  "real Codex receives a comments-only turn, then cold History restores its exact inline capture without replay",
  { skip: !configuration, timeout: 180_000 },
  async (context) => {
    process.env.LAPIS_DESKTOP_ACCEPTANCE_NATIVE_AI = "1";
    mkdirSync(resolve(".local/native-test"), { recursive: true });
    const root = mkdtempSync(resolve(".local/native-test/ai-local-comments-"));
    const vault = join(root, "Comment Notes");
    mkdirSync(vault);
    writeFileSync(join(vault, "Note.md"), "# Preserved comment note\n");
    mkdirSync(join(root, "profile"));
    copyFileSync(configuration, join(root, "profile/ai-runtime.json"));
    const first = await nativeSession(
      "ai-local-comments",
      root,
      executable,
      [],
      { background: false },
    );
    context.after(async () => {
      if (first.isRunning())
        writeFileSync(
          join(root, "first-ui.txt"),
          await first.browser
            .execute(() => document.body.innerText)
            .catch(String),
        );
      await first.cleanup();
    });
    writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
    await first.browser.$("button*=Open Vault").click();
    await ready(first);
    await first.browser
      .$('[contenteditable="true"][aria-label="Message"]')
      .addValue(prompt);
    await first.browser.$('button[aria-label="Send message"]').click();
    let metadata;
    await first.browser.waitUntil(
      () => {
        metadata = metadataFiles(vault)[0];
        return Boolean(metadata);
      },
      { timeout: 30_000 },
    );
    await completed(first, metadata, (records) =>
      records.some(
        (entry) =>
          entry.role === "assistant" &&
          entry.text === "Original captured answer",
      ),
    );
    const original = entries(join(dirname(metadata), "transcript.jsonl")).find(
      (entry) => entry.role === "assistant",
    );
    const source = first.browser.$(`[data-block-id="${original.id}/body"]`);
    await source.waitForDisplayed();
    await first.browser
      .$('button[aria-label="Comment on Assistant response"]')
      .click();
    const comment = first.browser.$(
      '[contenteditable="true"][aria-label="Comment on Assistant response"]',
    );
    await comment.waitForDisplayed();
    await comment.addValue(feedback);
    await first.browser.$('button[aria-label="Send message"]').click();
    await completed(
      first,
      metadata,
      (records) =>
        records.some((entry) => entry.id.startsWith("comment-context-sent:")) &&
        records.some(
          (entry) =>
            entry.role === "assistant" &&
            entry.text === "COMMENT-CONTEXT-READY",
        ),
    );
    await first.close(true);
    const journal = join(dirname(metadata), "transcript.jsonl");
    const recorded = entries(journal);
    const users = recorded.filter((entry) => entry.role === "user");
    assert.deepEqual(
      users.map((entry) => entry.text),
      [prompt, ""],
    );
    const capture = JSON.parse(users[1].contextBlocks[0].content).comments[0];
    const reply = recorded.find(
      (entry) =>
        entry.role === "assistant" && entry.text === "COMMENT-CONTEXT-READY",
    );
    assert.equal(
      reply.parentId,
      users[1].id,
      "A reply keeps its exact authored feedback parent",
    );
    assert.equal(capture.text, feedback);
    assert.equal(capture.anchor.blockId, `${original.id}/body`);
    assert.equal(
      capture.anchor.quote,
      original.text.slice(capture.anchor.from, capture.anchor.to),
    );
    assert.equal(
      recorded.filter((entry) => entry.role === "assistant").length,
      2,
    );
    assert.deepEqual(
      recorded.filter((entry) => entry.type === "error"),
      [],
    );
    const before = hash(journal);
    const cold = await nativeSession(
      "ai-local-comments-cold",
      root,
      executable,
      [],
      { background: false },
    );
    context.after(async () => {
      if (cold.isRunning())
        writeFileSync(
          join(root, "cold-ui.txt"),
          await cold.browser
            .execute(() => document.body.innerText)
            .catch(String),
        );
      await cold.cleanup();
    });
    await ready(cold);
    await cold.browser
      .$('button[aria-label="Show conversation history"]')
      .click();
    await cold.browser
      .$(`button*=${parse(readFileSync(metadata, "utf8")).title}`)
      .click();
    const inline = cold.browser.$(
      '[data-chat-comment-area][data-placement="inline"]',
    );
    await inline.waitForDisplayed({ timeout: 15_000 });
    assert.ok((await inline.getText()).includes(feedback));
    await inline.$('button[aria-label="Go to reply"]').click();
    const replyBody = cold.browser.$(`[data-block-id="${reply.id}/body"]`);
    await replyBody.waitForDisplayed();
    await cold.browser.waitUntil(() =>
      cold.browser.execute((id) => {
        const rect = document
          .querySelector(`[data-block-id="${id}/body"]`)
          .getBoundingClientRect();
        return rect.top >= 0 && rect.top < window.innerHeight;
      }, reply.id),
    );
    await cold.browser
      .$('[data-placement="reply"] button[aria-label^="Go to source:"]')
      .click();
    assert.equal(
      await cold.browser.$('[aria-label="Pending comments"]').isExisting(),
      false,
    );
    assert.equal(
      hash(journal),
      before,
      "Restoring comments cannot replay or republish the turn",
    );
    assert.equal(
      readFileSync(join(vault, "Note.md"), "utf8"),
      "# Preserved comment note\n",
    );
    await cold.close(true);
    assert.equal(hash(journal), before);
    console.log(`Native local comments evidence: ${root}`);
  },
);
