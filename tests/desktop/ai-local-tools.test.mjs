import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  copyFileSync,
  existsSync,
} from "node:fs";
import { join, resolve, dirname } from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { parse } from "yaml";
import { nativeSession } from "./native-session.mjs";

const configuration = process.env.LAPIS_AI_TEST_RUNTIME_CONFIG;
const executable = resolve(
  "src-tauri/target/debug/bundle/macos/Lapis Notes Acceptance.app/Contents/MacOS/lapis-desktop",
);
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
async function send(session, text) {
  await session.browser
    .$('[contenteditable="true"][aria-label="Message"]')
    .addValue(text);
  await session.browser.$('button[aria-label="Send message"]').click();
}
async function approveProviderTool(session, allowed) {
  for (const card of await session.browser.$$(
    '[data-testid="ai-approval-card"][data-origin="runtime"]',
  )) {
    if (!(await card.isDisplayed())) continue;
    const choices = await card.$$('button[data-approval-kind="allow-once"]');
    if (choices.length !== 1 || !(await choices[0].isEnabled())) continue;
    const title = (await card.$("strong").getText()).trim();
    if (!allowed.some((tool) => title === `mcp.lapis-tools.${tool}`))
      return `Unexpected provider permission: ${title}`;
    await choices[0].click();
  }
}
async function completed(session, metadata, predicate, allowed = ["read"]) {
  let endedWithoutExpectedResult;
  await session.browser.waitUntil(
    async () => {
      endedWithoutExpectedResult = await approveProviderTool(session, allowed);
      if (endedWithoutExpectedResult) return true;
      try {
        if (parse(readFileSync(metadata, "utf8")).pendingTurn) return false;
        const records = entries(join(dirname(metadata), "transcript.jsonl"));
        if (predicate(records)) return true;
        const user = records.findLastIndex(
          (e) => e.type === "message" && e.role === "user",
        );
        const terminal = records.findLastIndex(
          (e) =>
            e.type === "error" ||
            (e.type === "message" && e.role === "assistant"),
        );
        if (terminal > user) {
          endedWithoutExpectedResult =
            records[terminal].message ?? records[terminal].text;
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    { timeout: 90_000, interval: 100 },
  );
  assert.equal(
    endedWithoutExpectedResult,
    undefined,
    endedWithoutExpectedResult,
  );
}
async function pendingApproval(session) {
  let pending;
  let unexpected;
  await session.browser.waitUntil(
    async () => {
      unexpected = await approveProviderTool(session, ["read", "edit"]);
      if (unexpected) return true;
      for (const card of await session.browser.$$(
        '[data-testid="ai-approval-card"][data-origin="app-tool"]',
      )) {
        const allow = card.$("button*=Allow once");
        if ((await card.isDisplayed()) && (await allow.isEnabled())) {
          pending = card;
          return true;
        }
      }
      return false;
    },
    { timeout: 90_000, interval: 100 },
  );
  assert.equal(unexpected, undefined, unexpected);
  return pending;
}

test(
  "real Codex reads through Notes MCP, waits for guarded-edit approval, then cold History preserves exact local tool receipts",
  { skip: !configuration, timeout: 240_000 },
  async (context) => {
    process.env.LAPIS_DESKTOP_ACCEPTANCE_NATIVE_AI = "1";
    mkdirSync(resolve(".local/native-test"), { recursive: true });
    const root = mkdtempSync(resolve(".local/native-test/ai-local-tools-"));
    const vault = join(root, "Tool Notes"),
      note = join(vault, "Note.md");
    mkdirSync(vault);
    mkdirSync(join(root, "profile"));
    const witness = `NATIVE-TOOL-${randomUUID()}`;
    const original = `# Native application tools\n\nRead witness: ${witness}\n\nEditable: BEFORE\n`;
    writeFileSync(note, original);
    copyFileSync(configuration, join(root, "profile/ai-runtime.json"));
    const first = await nativeSession("ai-local-tools", root, executable, [], {
      background: true,
    });
    context.after(async () => {
      if (first.isRunning()) {
        writeFileSync(
          join(root, "first-ui.txt"),
          await first.browser
            .execute(() => document.body.innerText)
            .catch(String),
        );
      }
      await first.cleanup();
    });
    writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
    await first.browser.$("button*=Open Vault").click();
    await ready(first);
    await send(
      first,
      "Use the app-provided MCP server lapis-tools and its read tool to read Note.md. Do not use shell commands or other filesystem tools. Reply with only the Read witness value from that file.",
    );
    let metadata;
    await first.browser.waitUntil(
      () => {
        metadata = metadataFiles(vault)[0];
        return Boolean(metadata);
      },
      { timeout: 30_000 },
    );
    await completed(first, metadata, (records) =>
      records.some((e) => e.role === "assistant" && e.text.includes(witness)),
    );
    const journal = join(dirname(metadata), "transcript.jsonl");
    const read = entries(journal).filter(
      (e) =>
        e.type === "tool" && e.name === "read" && e.server === "lapis-tools",
    );
    assert.equal(
      read.length,
      1,
      "A real registered application callback must supply the witness",
    );
    assert.equal(read[0].state, "completed");
    assert.equal(readFileSync(note, "utf8"), original);
    assert.equal(existsSync(join(vault, ".jj")), false);

    await send(
      first,
      "Invoke the lapis-tools application edit tool now to replace the exact text Editable: BEFORE with Editable: AFTER in Note.md. The application will present its approval dialog before executing; submit the tool request so I can approve it there, rather than asking for approval in chat. Do not use shell commands or other filesystem tools. Reply exactly EDIT-APPLIED after the edit succeeds.",
    );
    const approval = await pendingApproval(first);
    assert.match(await approval.getText(), /Edit Note\.md/);
    assert.equal(
      readFileSync(note, "utf8"),
      original,
      "No edit occurs before the existing application approval",
    );
    await approval.$("button*=Allow once").click();
    await completed(
      first,
      metadata,
      (records) =>
        records.some(
          (e) => e.role === "assistant" && e.text.includes("EDIT-APPLIED"),
        ),
      ["read", "edit"],
    );
    assert.equal(
      readFileSync(note, "utf8"),
      original.replace("Editable: BEFORE", "Editable: AFTER"),
    );
    const saved = entries(journal);
    assert.equal(
      saved.filter(
        (e) =>
          e.type === "tool" &&
          e.name === "edit" &&
          e.server === "lapis-tools" &&
          e.state === "completed",
      ).length,
      1,
    );
    assert.equal(
      saved.filter(
        (e) => e.type === "approval.request" && /Edit Note\.md/.test(e.title),
      ).length,
      1,
    );
    assert.equal(
      saved.filter(
        (e) => e.type === "approval.response" && e.option.id === "allow-once",
      ).length,
      1,
    );
    assert.equal(
      saved.filter((e) => e.type === "message" && e.role === "user").length,
      2,
    );
    assert.equal(saved.filter((e) => e.type === "error").length, 0);
    await send(
      first,
      "Invoke the lapis-tools application edit tool now to replace Editable: AFTER with Editable: CANCELLED in Note.md. Submit the tool request so the application presents its approval dialog; do not ask for approval in chat. Do not use shell commands or other filesystem tools.",
    );
    await pendingApproval(first);
    await first.browser.$('button[aria-label="Stop agent"]').click();
    await first.browser
      .$('button[aria-label="Stop agent"]')
      .waitForExist({ reverse: true, timeout: 30_000 });
    await first.browser.waitUntil(
      () => {
        const records = entries(journal);
        return (
          records.filter((e) => e.type === "message" && e.role === "user")
            .length === 3 &&
          records.some(
            (e) =>
              e.type === "tool" &&
              e.name === "edit" &&
              e.server === "lapis-tools" &&
              e.state !== "completed",
          )
        );
      },
      { timeout: 30_000, interval: 100 },
    );
    assert.equal(
      readFileSync(note, "utf8"),
      original.replace("Editable: BEFORE", "Editable: AFTER"),
      "Stopping an unapproved write preserves the note",
    );
    // Stop hides immediately; durable terminal/effect publication still drains.
    await first.browser.waitUntil(
      () => {
        const pending = parse(readFileSync(metadata, "utf8")).pendingTurn;
        return (
          !pending ||
          entries(journal).some(
            (e) =>
              e.type === "error" &&
              e.id === `turn-unknown:${pending.id}` &&
              e.retryable === false,
          )
        );
      },
      { timeout: 30_000, interval: 100 },
    );
    const pending = parse(readFileSync(metadata, "utf8")).pendingTurn;
    if (pending)
      assert.ok(
        entries(journal).some(
          (e) =>
            e.type === "error" &&
            e.id === `turn-unknown:${pending.id}` &&
            e.retryable === false,
        ),
      );
    const before = hash(journal),
      noteHash = hash(note);
    await first.cleanup();

    const cold = await nativeSession(
      "ai-local-tools-cold",
      root,
      executable,
      [],
      { background: true },
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
    await cold.browser.$("button*=Use the app-provided MCP").click();
    await cold.browser
      .$('[data-testid="ai-transcript-panel"]')
      .waitForDisplayed();
    await cold.browser.waitUntil(
      async () =>
        (await cold.browser.execute(() => document.body.innerText)).includes(
          "EDIT-APPLIED",
        ),
      { timeout: 15_000 },
    );
    assert.equal(
      hash(journal),
      before,
      "Cold restore neither replays tools nor rewrites the transcript",
    );
    assert.equal(hash(note), noteHash);
    assert.equal(existsSync(join(vault, ".jj")), false);
    writeFileSync(
      join(root, "accepted.json"),
      JSON.stringify(
        {
          journal,
          readId: read[0].id,
          readToolId: read[0].toolId,
          toolCount: saved.filter((e) => e.type === "tool").length,
          journalSha256: before,
          noteSha256: noteHash,
          profile: "local-files",
          nativeAppTools: true,
        },
        null,
        2,
      ),
    );
  },
);
