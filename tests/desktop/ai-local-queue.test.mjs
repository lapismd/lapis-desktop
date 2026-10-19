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
const metadataFiles = (root) =>
  readdirSync(root, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? metadataFiles(join(root, e.name))
      : e.name === "metadata.yaml"
        ? [join(root, e.name)]
        : [],
  );
const entries = (path) =>
  readFileSync(path, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse);
const hash = (path) =>
  createHash("sha256").update(readFileSync(path)).digest("hex");
async function ready(s) {
  await s.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  if (!(await s.browser.$('[data-testid="ai-chat-panel"]').isDisplayed()))
    await s.browser.$('button[aria-label="Open Chat"]').click();
  await s.browser
    .$(
      '[data-testid="ai-chat-panel"][data-initializing="false"][data-model-catalog-loading="false"]',
    )
    .waitForDisplayed({ timeout: 45000 });
}
async function send(s, text, queued = false) {
  await s.browser
    .$('[contenteditable="true"][aria-label="Message"]')
    .addValue(text);
  await s.browser
    .$(`button[aria-label="${queued ? "Queue" : "Send"} message"]`)
    .click();
}
async function providerPermissions(s) {
  for (const card of await s.browser.$$(
    '[data-testid="ai-approval-card"][data-origin="runtime"]',
  )) {
    if (!(await card.isDisplayed())) continue;
    const title = (await card.$("strong").getText()).trim();
    assert.ok(
      ["mcp.lapis-tools.read", "mcp.lapis-tools.edit"].includes(title),
      `Unexpected provider permission: ${title}`,
    );
    const allow = card.$('button[data-approval-kind="allow-once"]');
    if (await allow.isEnabled()) await allow.click();
  }
}
async function appApproval(s) {
  let pending;
  await s.browser.waitUntil(
    async () => {
      await providerPermissions(s);
      for (const card of await s.browser.$$(
        '[data-testid="ai-approval-card"][data-origin="app-tool"]',
      )) {
        if (await card.isDisplayed()) {
          pending = card;
          return true;
        }
      }
      return false;
    },
    { timeout: 90000, interval: 100 },
  );
  return pending;
}
async function queuedText(s, metadata, text) {
  await s.browser.waitUntil(
    () =>
      parse(readFileSync(metadata, "utf8")).queuedMessages?.some(
        (q) => q.user.text === text,
      ),
    { timeout: 15000, interval: 100 },
  );
  return parse(readFileSync(metadata, "utf8")).queuedMessages.find(
    (q) => q.user.text === text,
  );
}
async function complete(s, metadata, id, witness) {
  const journal = join(dirname(metadata), "transcript.jsonl");
  await s.browser.waitUntil(
    async () => {
      await providerPermissions(s);
      const m = parse(readFileSync(metadata, "utf8")),
        xs = entries(journal);
      return (
        !m.pendingDispatch &&
        !m.pendingTurn &&
        !m.queuedMessages?.length &&
        xs.some(
          (e) =>
            e.type === "queue.outcome" &&
            e.queued.id === id &&
            e.outcome === "completed",
        ) &&
        xs.some(
          (e) =>
            e.type === "message" &&
            e.role === "assistant" &&
            e.text.includes(witness),
        )
      );
    },
    { timeout: 120000, interval: 100 },
  );
}

test(
  "real Codex queues one local follow-up, cancels another and explicitly resumes untouched waiting work after cold History",
  { skip: !configuration, timeout: 420000 },
  async (context) => {
    process.env.LAPIS_DESKTOP_ACCEPTANCE_NATIVE_AI = "1";
    mkdirSync(resolve(".local/native-test"), { recursive: true });
    const root = mkdtempSync(resolve(".local/native-test/ai-queue-")),
      vault = join(root, "Queued Notes"),
      note = join(vault, "Note.md");
    mkdirSync(vault);
    mkdirSync(join(root, "profile"));
    const witness = `QUEUE-READ-${randomUUID()}`,
      original = `# Queued Notes\n\nRead witness: ${witness}\nEditable: BEFORE\n`;
    writeFileSync(note, original);
    copyFileSync(configuration, join(root, "profile/ai-runtime.json"));
    const first = await nativeSession("ai-queue", root, executable, [], {
      background: false,
    });
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
    const active =
      "Use the app-provided MCP server lapis-tools. Read Note.md with read, then use edit to replace only Editable: BEFORE with Editable: AFTER. Do not use shell commands or other filesystem tools. After the edit completes reply with EDIT-OK.";
    await send(first, active);
    await appApproval(first);
    const metadata = metadataFiles(vault)[0],
      journal = join(dirname(metadata), "transcript.jsonl");
    assert.equal(
      readFileSync(note, "utf8"),
      original,
      "The first edit remains unapplied before owner approval",
    );
    const follow =
      "Use the app-provided MCP server lapis-tools and read to read Note.md after the preceding turn. Do not use shell commands or other filesystem tools. Reply with only its Read witness value and its Editable line.";
    await send(first, follow, true);
    const queued = await queuedText(first, metadata, follow);
    const cancelled =
      "CANCELLED-QUEUE-WITNESS: this message must never be sent to any agent.";
    await send(first, cancelled, true);
    const cancelledQueue = await queuedText(first, metadata, cancelled);
    assert.equal(
      entries(journal).filter((e) => e.type === "message" && e.role === "user")
        .length,
      1,
      "Waiting messages remain outside active agent context",
    );
    let cancelButton;
    for (const row of await first.browser.$$(
      'section[aria-label="Queued messages"] li',
    ))
      if ((await row.getText()).includes(cancelled))
        cancelButton = row.$('button[aria-label^="Cancel queued message for"]');
    assert.ok(
      cancelButton,
      "The exact waiting message has a cancellation action",
    );
    await cancelButton.click();
    await first.browser.waitUntil(
      () =>
        entries(journal).some(
          (e) =>
            e.type === "queue.outcome" &&
            e.queued.id === cancelledQueue.id &&
            e.outcome === "cancelled",
        ),
      { timeout: 15000 },
    );
    const firstApproval = await appApproval(first);
    await firstApproval.$('button[data-approval-kind="allow-once"]').click();
    await complete(first, metadata, queued.id, witness);
    const afterFirst = entries(journal),
      users = afterFirst.filter(
        (e) => e.type === "message" && e.role === "user",
      );
    assert.deepEqual(
      users.map((e) => e.text),
      [active, follow],
    );
    assert.equal(users[1].id, queued.user.id);
    assert.equal(
      readFileSync(note, "utf8"),
      original.replace("Editable: BEFORE", "Editable: AFTER"),
    );
    const afterQueued = afterFirst.slice(
      afterFirst.findIndex((e) => e.id === queued.user.id),
    );
    assert.ok(
      afterQueued.some(
        (e) =>
          e.type === "tool" &&
          e.name === "read" &&
          e.server === "lapis-tools" &&
          e.state === "completed",
      ),
    );
    assert.ok(
      afterQueued.some(
        (e) =>
          e.type === "message" &&
          e.role === "assistant" &&
          e.text.includes(witness) &&
          e.text.includes("AFTER"),
      ),
    );
    assert.equal(existsSync(join(vault, ".jj")), false);
    const stopped =
      "Use the app-provided MCP server lapis-tools. Read Note.md with read, then use edit to replace only Editable: AFTER with Editable: MUST-NOT-APPLY. Do not use shell commands or other filesystem tools.";
    await send(first, stopped);
    await appApproval(first);
    const coldFollow =
      "Use the app-provided MCP server lapis-tools and read to read Note.md. Do not use shell commands or other filesystem tools. Reply with the Read witness value and Editable line only. This is an explicit new follow-up, not a retry of any earlier edit.";
    await send(first, coldFollow, true);
    const coldQueued = await queuedText(first, metadata, coldFollow);
    await first.browser.$('button[aria-label="Stop agent"]').click();
    await first.browser
      .$("button*=Resume queue")
      .waitForDisplayed({ timeout: 30000 });
    assert.equal(
      readFileSync(note, "utf8"),
      original.replace("Editable: BEFORE", "Editable: AFTER"),
      "Stopping an unapproved edit preserves the file",
    );
    await first.cleanup();
    const before = hash(journal),
      agents = hash(join(dirname(metadata), "agents.jsonl")),
      noteHash = hash(note),
      metadataHash = hash(metadata);
    const cold = await nativeSession("ai-queue-cold", root, executable, [], {
      background: false,
    });
    context.after(async () => {
      if (cold.isRunning()) {
        writeFileSync(
          join(root, "cold-ui.txt"),
          await cold.browser
            .execute(() => document.body.innerText)
            .catch(String),
        );
        writeFileSync(
          join(root, "cold-diagnostics.json"),
          JSON.stringify(
            await cold.browser
              .execute(async () => {
                const sessions = await globalThis.__TAURI__.core.invoke(
                  "plugin:lapis-ai|list",
                );
                return {
                  panels: [
                    ...document.querySelectorAll(
                      '[data-testid="ai-chat-panel"]',
                    ),
                  ].map((p) => ({
                    text: p.innerText,
                    visible: p.getBoundingClientRect().height > 0,
                  })),
                  sessions,
                  snapshots: await Promise.all(
                    sessions.map((s) =>
                      globalThis.__TAURI__.core
                        .invoke("plugin:lapis-ai|snapshot", {
                          sessionId: s.sessionId,
                          after: 0,
                        })
                        .catch(String),
                    ),
                  ),
                };
              })
              .catch(String),
            null,
            2,
          ),
        );
      }
      await cold.cleanup();
    });
    await ready(cold);
    await cold.browser
      .$('button[aria-label="Show conversation history"]')
      .click();
    await cold.browser.$("button*=Use the app-provided MCP server").click();
    await cold.browser
      .$("button*=Resume queue")
      .waitForDisplayed({ timeout: 20000 });
    assert.equal(hash(journal), before);
    assert.equal(hash(metadata), metadataHash);
    assert.equal(hash(join(dirname(metadata), "agents.jsonl")), agents);
    assert.equal(hash(note), noteHash);
    assert.ok(
      parse(readFileSync(metadata, "utf8")).queuedMessages.some(
        (q) => q.id === coldQueued.id && q.state === "queued",
      ),
    );
    assert.equal(
      entries(journal).filter((e) => e.type === "message" && e.role === "user")
        .length,
      3,
      "Cold History cannot publish the waiting prompt or replay an old prompt",
    );
    await cold.browser.$("button*=Resume queue").click();
    writeFileSync(
      join(root, "cold-resume-panels.json"),
      JSON.stringify(
        await cold.browser.execute(() =>
          [...document.querySelectorAll('[data-testid="ai-chat-panel"]')].map(
            (p) => ({
              text: p.innerText,
              visible: p.getBoundingClientRect().height > 0,
            }),
          ),
        ),
        null,
        2,
      ),
    );
    await complete(cold, metadata, coldQueued.id, witness);
    const final = entries(journal),
      finalUsers = final.filter(
        (e) => e.type === "message" && e.role === "user",
      );
    assert.deepEqual(
      finalUsers.map((e) => e.text),
      [active, follow, stopped, coldFollow],
    );
    assert.equal(finalUsers[3].id, coldQueued.user.id);
    assert.equal(
      final.filter(
        (e) =>
          e.type === "tool" &&
          e.name === "edit" &&
          e.server === "lapis-tools" &&
          e.state === "completed",
      ).length,
      1,
    );
    const resumedRecords = final.slice(
      final.findIndex((e) => e.id === coldQueued.user.id),
    );
    assert.ok(
      resumedRecords.some(
        (e) =>
          e.type === "tool" &&
          e.name === "read" &&
          e.server === "lapis-tools" &&
          e.state === "completed",
      ),
    );
    assert.ok(
      resumedRecords.some(
        (e) =>
          e.type === "message" &&
          e.role === "assistant" &&
          e.text.includes(witness) &&
          e.text.includes("AFTER"),
      ),
    );
    assert.equal(hash(note), noteHash);
    assert.equal(existsSync(join(vault, ".jj")), false);
    writeFileSync(
      join(root, "accepted.json"),
      JSON.stringify(
        {
          journal,
          journalSha256: hash(journal),
          queuedIds: [queued.id, coldQueued.id],
          cancelledId: cancelledQueue.id,
          authoredMessages: 4,
          completedEdits: 1,
          profile: "local-files",
        },
        null,
        2,
      ),
    );
  },
);
