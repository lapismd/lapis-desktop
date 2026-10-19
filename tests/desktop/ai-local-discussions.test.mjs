import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  writeFileSync,
  readFileSync,
  copyFileSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { nativeSession } from "./native-session.mjs";
import {
  records,
  hash,
  metadataFiles,
  journal,
  ready,
  openMainChat,
  complete,
  send,
  commentSelection,
  replyToThread,
  openHistory,
  diagnostic,
} from "./ai-discussion-ui.mjs";

const configuration = process.env.LAPIS_AI_TEST_RUNTIME_CONFIG;
const executable = resolve(
  "src-tauri/target/debug/bundle/macos/Lapis Notes Acceptance.app/Contents/MacOS/lapis-desktop",
);
const declaration = 'export const reviewLabel = "Keep current context";';
const note = [
  "# Native discussion sample",
  "",
  "```typescript",
  declaration,
  "```",
  "",
  "| Action | Owner | State |",
  "| --- | --- | --- |",
  "| Review parser | Notes team | Ready |",
  "| Preserve history | Notes team | Waiting |",
  "",
].join("\n");
const ack = "NATIVE-DISCUSSION-ACK";
const followupAck = "NATIVE-THREAD-CONTINUED";
const manualInput = process.env.LAPIS_AI_NATIVE_MANUAL_SELECTION === "1";
const feedback = [
  `Keep this exact declaration. Do not use tools. Reply exactly: ${ack}`,
  `Keep this original table row. Do not use tools. Reply exactly: ${ack}`,
  `Keep this captured read result. Do not use tools. Reply exactly: ${ack}`,
];
const captured = (entry) =>
  entry.contextBlocks.flatMap((block) => JSON.parse(block.content).comments);

test(
  "native code/table/tool comments and continued threads survive cold local History without replay",
  { skip: !configuration, timeout: 300_000 },
  async (context) => {
    process.env.LAPIS_DESKTOP_ACCEPTANCE_NATIVE_AI = "1";
    mkdirSync(resolve(".local/native-test"), { recursive: true });
    const root = mkdtempSync(resolve(".local/native-test/ai-discussions-"));
    const vault = join(root, "Discussion Notes");
    const stage = (phase) =>
      writeFileSync(
        join(root, "ui-stage.json"),
        JSON.stringify({ phase, root, at: new Date().toISOString() }),
      );
    mkdirSync(vault);
    writeFileSync(join(vault, "Sample.md"), note);
    mkdirSync(join(root, "profile"));
    copyFileSync(configuration, join(root, "profile/ai-runtime.json"));
    const first = await nativeSession("ai-discussions", root, executable, [], {
      background: false,
    });
    context.after(async () => {
      await diagnostic(first, join(root, "first-ui.txt"));
      await first.cleanup();
    });
    writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
    await first.browser.$("button*=Open Vault").click();
    await ready(first);
    await openMainChat(first);
    stage("main-ready");
    await send(
      first,
      "Use only the lapis-tools read tool to read Sample.md. Then reproduce the entire file verbatim as Markdown, including its TypeScript fenced code block and table. Do not wrap the entire response in a code fence. Do not use shell commands or other filesystem tools.",
    );
    let metadata;
    await first.browser.waitUntil(
      () => {
        metadata = metadataFiles(vault)[0];
        return !!metadata;
      },
      { timeout: 30_000 },
    );
    await complete(
      first,
      metadata,
      (items) =>
        items.some(
          (e) =>
            e.role === "assistant" &&
            e.text.includes(declaration) &&
            e.text.includes("| Review parser |"),
        ),
      true,
    );
    const initial = records(journal(metadata));
    const original = initial.find(
      (e) => e.role === "assistant" && e.text.includes(declaration),
    );
    const read = initial.find(
      (e) =>
        e.type === "tool" &&
        e.name === "read" &&
        e.server === "lapis-tools" &&
        e.state === "completed",
    );
    assert.ok(read, "The sample was read by the registered Notes tool");
    const body = first.browser.$(`[data-block-id="${original.id}/body"]`);
    await body.scrollIntoView({ block: "center" });
    stage("comment-input");
    if (manualInput) {
      await first.browser.waitUntil(
        // Physical input owns Send too: observing a draft during paste must
        // not submit while the native input sequence is still completing.
        () =>
          records(journal(metadata)).filter((e) => e.role === "user").length ===
          2,
        { timeout: 180_000, interval: 100 },
      );
    } else {
      await commentSelection(
        first,
        body.$('[role="textbox"][aria-label="typescript code"]'),
        feedback[0],
        "Assistant response",
        declaration,
      );
      const cell = body.$("td*=Review parser").$('[contenteditable="true"]');
      await cell.scrollIntoView({ block: "center" });
      await commentSelection(
        first,
        cell,
        feedback[1],
        "Assistant response",
        "Review parser",
      );
      const expandTools = first.browser.$("button=Tool activity");
      if (await expandTools.isExisting()) {
        await expandTools.scrollIntoView({ block: "center" });
        await expandTools.click();
      }
      const showRead = first.browser.$(
        'button[aria-label="Show details for read"]',
      );
      if (
        !(await first.browser
          .$('button[aria-label="Hide details for read"]')
          .isExisting())
      ) {
        await showRead.waitForExist({ timeout: 15_000 });
        await showRead.scrollIntoView({ block: "center" });
        await showRead.click();
      }
      const toolComment = first.browser.$(
        'button[aria-label="Comment on read details"]',
      );
      await toolComment.waitForExist({ timeout: 15_000 });
      await toolComment.scrollIntoView({ block: "center" });
      await toolComment.click();
      await first.browser
        .$('[contenteditable="true"][aria-label="Comment on read details"]')
        .addValue(feedback[2]);
    }
    if (!manualInput) await send(first);
    await complete(first, metadata, (items) =>
      items.some((e) => e.role === "assistant" && e.text.trim() === ack),
    );
    await first.close(true);

    const saved = records(journal(metadata));
    const users = saved.filter((e) => e.role === "user");
    assert.equal(users.length, 2);
    assert.equal(users[1].text, "");
    const comments = captured(users[1]);
    assert.deepEqual(
      comments.map((c) => c.text),
      feedback,
    );
    assert.equal(comments[0].anchor.quote, declaration);
    assert.equal(comments[1].anchor.quote, "Review parser");
    assert.match(
      comments[1].anchor.tableContext.markdown,
      /Review parser.*Notes team.*Ready/,
    );
    for (const c of comments.slice(0, 2)) {
      assert.equal(c.anchor.blockId, `${original.id}/body`);
      assert.equal(
        original.text.slice(c.anchor.from, c.anchor.to),
        c.anchor.quote,
      );
    }
    assert.equal(comments[2].anchor.blockId, `${read.id}/detail`);
    const answer = saved.find(
      (e) => e.role === "assistant" && e.text.trim() === ack,
    );
    assert.equal(answer.parentId, users[1].id);
    const before = hash(journal(metadata));

    const cold = await nativeSession(
      "ai-discussions-cold",
      root,
      executable,
      [],
      { background: false },
    );
    context.after(async () => {
      await diagnostic(cold, join(root, "cold-ui.txt"));
      await cold.cleanup();
    });
    await openHistory(cold, metadata);
    stage("cold-ready");
    assert.equal(
      hash(journal(metadata)),
      before,
      "Cold restoration cannot write or replay old work",
    );
    const thread = cold.browser.$(
      `[data-placement="inline"][data-thread-id="${comments[0].threadId}"]`,
    );
    await thread.scrollIntoView({ block: "center" });
    assert.ok((await thread.getText()).includes(feedback[0]));
    await replyToThread(
      cold,
      comments[0].threadId,
      `What about cold recovery? Do not use tools. Reply exactly: ${followupAck}`,
    );
    await send(cold);
    await complete(cold, metadata, (items) =>
      items.some(
        (e) => e.role === "assistant" && e.text.trim() === followupAck,
      ),
    );
    await cold.close(true);
    const continued = records(journal(metadata));
    const allUsers = continued.filter((e) => e.role === "user");
    assert.equal(allUsers.length, 3);
    assert.equal(allUsers[2].text, "");
    const next = captured(allUsers[2]);
    assert.equal(
      next.length,
      1,
      "Only newly authored feedback is submitted again",
    );
    assert.equal(next[0].threadId, comments[0].threadId);
    assert.notEqual(next[0].commentId, comments[0].commentId);
    assert.deepEqual(next[0].anchor, comments[0].anchor);
    assert.equal(
      continued.find(
        (e) => e.role === "assistant" && e.text.trim() === followupAck,
      ).parentId,
      allUsers[2].id,
    );
    const finalHash = hash(journal(metadata));

    const restored = await nativeSession(
      "ai-discussions-restored",
      root,
      executable,
      [],
      { background: false },
    );
    context.after(async () => {
      await diagnostic(restored, join(root, "restored-ui.txt"));
      await restored.cleanup();
    });
    await openHistory(restored, metadata);
    stage("restored-ready");
    const codeThread = restored.browser.$(
      `[data-placement="inline"][data-thread-id="${comments[0].threadId}"]`,
    );
    await codeThread.scrollIntoView({ block: "center" });
    const cards = await codeThread.$$('[data-status="replied"]');
    assert.equal(cards.length, 2);
    for (const [index, id] of [
      [0, answer.id],
      [
        1,
        continued.find(
          (e) => e.role === "assistant" && e.text.trim() === followupAck,
        ).id,
      ],
    ]) {
      await cards[index].$('button[aria-label="Go to reply"]').click();
      const target = restored.browser.$(`[data-block-id="${id}/body"]`);
      await target.waitForDisplayed();
      assert.ok((await target.getText()).includes(index ? followupAck : ack));
      await codeThread.scrollIntoView({ block: "center" });
    }
    await restored.close(true);
    assert.equal(hash(journal(metadata)), finalHash);
    assert.equal(readFileSync(join(vault, "Sample.md"), "utf8"), note);
    console.log(`Native discussion evidence: ${root}`);
  },
);
