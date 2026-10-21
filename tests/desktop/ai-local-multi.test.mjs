import { revealConversationHistory } from "./ai-view-navigation.mjs";
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

async function participant(session, label, root) {
  await session.browser.$('button[aria-label="Conversation actions"]').click();
  await session.browser.$('[data-ai-part="conversation-menu"]').waitForExist();
  const facts = await session.browser.execute(() => ({
    menu: document.querySelector('[data-ai-part="conversation-menu"]')
      ?.outerHTML,
    focus: document.activeElement?.outerHTML,
    width: innerWidth,
    height: innerHeight,
  }));
  writeFileSync(
    join(root, `menu-${label}.json`),
    JSON.stringify(facts, null, 2),
  );
  const item = session.browser.$(
    '[data-ai-part="conversation-menu"] [data-ui-part="dropdown-menu-item"]',
  );
  await item.waitForExist();
  assert.equal(
    (await item.getText()).replace(/\s+/gu, " ").trim(),
    "Add Agent",
  );
  try {
    await item.waitForDisplayed();
  } catch (error) {
    writeFileSync(
      join(root, `visibility-${label}.json`),
      JSON.stringify(
        await session.browser.execute(() => {
          const rows = [];
          let e = document.querySelector(
            '[data-ai-part="conversation-menu"] [data-ui-part="dropdown-menu-item"]',
          );
          while (e) {
            const s = getComputedStyle(e),
              r = e.getBoundingClientRect();
            rows.push({
              tag: e.tagName,
              role: e.getAttribute("role"),
              opacity: s.opacity,
              display: s.display,
              visibility: s.visibility,
              x: r.x,
              y: r.y,
              w: r.width,
              h: r.height,
            });
            e = e.parentElement;
          }
          return rows;
        }),
        null,
        2,
      ),
    );
    throw error;
  }
  await item.click();
  const dialog = session.browser.$('[role="dialog"]');
  await dialog.waitForDisplayed();
  await dialog.$("input").setValue(label);
  await dialog.$("button*=Add participant").click();
  await dialog.waitForExist({ reverse: true });
}
async function choose(session, query, label) {
  await session.browser
    .$('[contenteditable="true"][aria-label="Message"]')
    .addValue(`@${query}`);
  await session.browser.$('[role="option"]').waitForDisplayed();
  await session.browser.keys("Enter");
  await session.browser
    .$(`button[aria-label="Remove recipient @${label}"]`)
    .waitForDisplayed();
}
test(
  "real Codex delivers one authored local message to two configured participants and cold History never replays it",
  { skip: !configuration, timeout: 240_000 },
  async (context) => {
    process.env.LAPIS_DESKTOP_ACCEPTANCE_NATIVE_AI = "1";
    mkdirSync(resolve(".local/native-test"), { recursive: true });
    const root = mkdtempSync(resolve(".local/native-test/ai-multi-"));
    const vault = join(root, "Multi Notes"),
      note = join(vault, "Note.md");
    mkdirSync(vault);
    mkdirSync(join(root, "profile"));
    const witness = `MULTI-READ-${randomUUID()}`,
      original = `# Notes\n\nRead witness: ${witness}\n`;
    writeFileSync(note, original);
    copyFileSync(configuration, join(root, "profile/ai-runtime.json"));
    const first = await nativeSession("ai-multi", root, executable, [], {
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
    await participant(first, "Notes reviewer", root);
    await participant(first, "Notes writer", root);
    assert.equal(
      metadataFiles(vault).length,
      0,
      "Creating participant names cannot create a conversation or prompt",
    );
    await choose(first, "reviewer", "Notes reviewer");
    await choose(first, "writer", "Notes writer");
    const prompt =
      "Use the app-provided MCP server lapis-tools and its read tool to read Note.md. Do not use shell commands or other filesystem tools. Reply with only the Read witness value from that file.";
    await send(first, prompt);
    let metadata, records;
    await first.browser.waitUntil(
      async () => {
        const unexpected = await approveProviderTool(first, ["read"]);
        assert.equal(unexpected, undefined, unexpected);
        metadata = metadataFiles(vault)[0];
        if (!metadata) return false;
        records = entries(join(dirname(metadata), "transcript.jsonl"));
        if (parse(readFileSync(metadata, "utf8")).pendingDispatch) return false;
        return (
          records.filter(
            (e) =>
              e.type === "agent.delivery" && e.delivery.state === "completed",
          ).length === 2
        );
      },
      { timeout: 120_000, interval: 100 },
    );
    assert.equal(
      records.filter((e) => e.type === "message" && e.role === "user").length,
      1,
    );
    const user = records.find((e) => e.type === "message" && e.role === "user");
    assert.equal(user.text, prompt);
    assert.deepEqual(
      user.recipients.map((r) => r.label),
      ["Notes reviewer", "Notes writer"],
    );
    const bindings = entries(join(dirname(metadata), "agents.jsonl")).filter(
      (e) => e.type === "binding.created",
    );
    assert.equal(bindings.length, 2);
    assert.notEqual(bindings[0].id, bindings[1].id);
    assert.notEqual(bindings[0].nativeSessionId, bindings[1].nativeSessionId);
    assert.deepEqual(
      bindings.map((b) => b.participant.label),
      ["Notes reviewer", "Notes writer"],
    );
    assert.equal(
      records.filter(
        (e) =>
          e.type === "tool" &&
          e.name === "read" &&
          e.server === "lapis-tools" &&
          e.state === "completed",
      ).length,
      2,
    );
    assert.equal(
      records.filter((e) => e.role === "assistant" && e.text.includes(witness))
        .length,
      2,
    );
    assert.equal(readFileSync(note, "utf8"), original);
    assert.equal(existsSync(join(vault, ".jj")), false);
    await first.cleanup();
    const journal = join(dirname(metadata), "transcript.jsonl"),
      before = hash(journal),
      agents = hash(join(dirname(metadata), "agents.jsonl"));
    const cold = await nativeSession("ai-multi-cold", root, executable, [], {
      background: false,
    });
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
    await revealConversationHistory(cold);
    await cold.browser.$("button*=Use the app-provided MCP").click();
    await cold.browser.waitUntil(
      async () => {
        const text = await cold.browser.execute(() => document.body.innerText);
        return (
          text.includes("Notes reviewer") &&
          text.includes("Notes writer") &&
          text.includes("Completed")
        );
      },
      { timeout: 15_000 },
    );
    assert.equal(hash(journal), before);
    assert.equal(hash(join(dirname(metadata), "agents.jsonl")), agents);
    assert.equal(readFileSync(note, "utf8"), original);
    assert.equal(existsSync(join(vault, ".jj")), false);
    writeFileSync(
      join(root, "accepted.json"),
      JSON.stringify(
        {
          journal,
          journalSha256: before,
          agentsSha256: agents,
          participants: user.recipients.map((r) => r.id),
          readCount: 2,
          profile: "local-files",
        },
        null,
        2,
      ),
    );
  },
);
