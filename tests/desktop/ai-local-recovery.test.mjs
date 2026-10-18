import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  copyFileSync,
} from "node:fs";
import { join, resolve, dirname } from "node:path";
import { parse } from "yaml";
import { nativeSession } from "./native-session.mjs";

// Opt-in real-provider proof. Configuration contains device paths, never credentials.
const configuration = process.env.LAPIS_AI_TEST_RUNTIME_CONFIG;
const executable = resolve(
  "src-tauri/target/debug/bundle/macos/Lapis Notes Acceptance.app/Contents/MacOS/lapis-desktop",
);
const prompt =
  "For a local transcript interruption check, output the integers 1 through 1000, one per line. Do not use tools or inspect files.";
function files(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(join(root, entry.name))
      : [join(root, entry.name)],
  );
}
function journal(root) {
  return Object.fromEntries(
    files(root)
      .filter((path) =>
        /(?:metadata.yaml|agents.jsonl|transcript.jsonl)$/.test(path),
      )
      .map((path) => [
        path,
        createHash("sha256").update(readFileSync(path)).digest("hex"),
      ]),
  );
}
const entries = (path) =>
  readFileSync(path, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse);
async function invoke(session, command) {
  return session.browser.execute(
    (command) => globalThis.__TAURI__.core.invoke(command),
    command,
  );
}
async function panelText(session) {
  return session.browser.execute(
    () =>
      document.querySelector('[data-testid="ai-chat-panel"]')?.innerText ?? "",
  );
}
async function send(session, text) {
  const editor = session.browser.$(
    '[contenteditable="true"][aria-label="Message"]',
  );
  await editor.waitForDisplayed();
  await editor.addValue(text);
  await session.browser.$('button[aria-label="Send message"]').click();
}
test(
  "real Codex interrupted after dispatch reopens local files cold without replay, then accepts one new message",
  { skip: !configuration, timeout: 180_000 },
  async (context) => {
    process.env.LAPIS_DESKTOP_ACCEPTANCE_NATIVE_AI = "1";
    const parent = resolve(".local/native-test");
    mkdirSync(parent, { recursive: true });
    const root = mkdtempSync(join(parent, "ai-local-recovery-"));
    const vault = join(root, "Recovery Notes");
    mkdirSync(vault);
    writeFileSync(join(vault, "Note.md"), "# Preserved recovery note\n");
    mkdirSync(join(root, "profile"));
    copyFileSync(configuration, join(root, "profile/ai-runtime.json"));
    const first = await nativeSession(
      "ai-local-recovery",
      root,
      executable,
      [],
      { background: true },
    );
    context.after(async () => {
      if (first.isRunning()) {
        const body = await first.browser
          .execute(() => document.body.innerText)
          .catch(String);
        writeFileSync(join(root, "first-ui.txt"), body);
      }
      await first.cleanup();
    });
    assert.equal((await invoke(first, "shell_info")).nativeAiPolicy, true);
    writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
    await first.browser.$("button*=Open Vault").click();
    await first.browser.$('[data-notes-ready="true"]').waitForDisplayed();
    await first.browser.$('button[aria-label="Open Chat"]').click();
    await first.browser
      .$('[data-testid="ai-chat-panel"][data-initializing="false"]')
      .waitForDisplayed({ timeout: 45_000 });
    await send(first, prompt);
    let metadataPath;
    await first.browser.waitUntil(
      async () => {
        metadataPath = files(vault).find(
          (path) =>
            path.endsWith("/metadata.yaml") &&
            parse(readFileSync(path, "utf8"))?.pendingTurn,
        );
        return (
          Boolean(metadataPath) && /\b1\s+2\s+3\b/.test(await panelText(first))
        );
      },
      { timeout: 60_000, interval: 100 },
    );
    const directory = dirname(metadataPath);
    const metadata = parse(readFileSync(metadataPath, "utf8"));
    assert.ok(metadata.pendingTurn);
    const original = entries(join(directory, "transcript.jsonl"));
    assert.deepEqual(
      original
        .filter((entry) => entry.role === "user")
        .map((entry) => entry.text),
      [prompt],
    );
    const before = journal(vault);
    // Abrupt process death bypasses every graceful renderer/controller checkpoint.
    const matches = execFileSync("/bin/ps", ["-axo", "pid=,comm="], {
      encoding: "utf8",
    })
      .split("\n")
      .map((line) => line.trim().match(/^(\d+)\s+(.*)$/))
      .filter((match) => match?.[2] === executable);
    assert.equal(
      matches.length,
      1,
      "Only this isolated acceptance process may be killed",
    );
    process.kill(Number(matches[0][1]), "SIGKILL");
    assert.deepEqual(await first.waitForExit(), {
      code: null,
      signal: "SIGKILL",
    });
    assert.deepEqual(journal(vault), before);

    const cold = await nativeSession(
      "ai-local-recovery-cold",
      root,
      executable,
      [],
      { background: true },
    );
    context.after(async () => {
      if (cold.isRunning()) {
        const body = await cold.browser
          .execute(() => document.body.innerText)
          .catch(String);
        writeFileSync(join(root, "cold-ui.txt"), body);
      }
      await cold.cleanup();
    });
    await cold.browser.$('[data-notes-ready="true"]').waitForDisplayed();
    const panel = cold.browser.$('[data-testid="ai-chat-panel"]');
    if (!(await panel.isDisplayed()))
      await cold.browser.$('button[aria-label="Open Chat"]').click();
    await cold.browser
      .$(
        '[data-testid="ai-chat-panel"][data-initializing="false"][data-model-catalog-loading="false"]',
      )
      .waitForDisplayed({ timeout: 45_000 });
    const history = cold.browser.$(
      'button[aria-label="Show conversation history"]',
    );
    await history.waitForDisplayed();
    await history.click();
    const conversation = cold.browser.$(`button*=${metadata.title}`);
    await conversation.waitForDisplayed();
    await conversation.click();
    await cold.browser.waitUntil(
      async () =>
        (await panelText(cold)).includes("previous turn's outcome is unknown"),
      { timeout: 15_000 },
    );
    assert.ok((await panelText(cold)).includes(prompt));
    assert.equal(
      await cold.browser.$('button[aria-label="Retry message"]').isExisting(),
      false,
    );
    assert.deepEqual(await invoke(cold, "plugin:lapis-ai|list"), []);
    assert.deepEqual(
      journal(vault),
      before,
      "Cold restore is read-only and cannot replay the old prompt",
    );
    await send(
      cold,
      "Do not use tools. Reply exactly: Recovered local transcript passed",
    );
    await cold.browser.waitUntil(
      async () =>
        (await panelText(cold)).includes("Recovered local transcript passed"),
      { timeout: 60_000 },
    );
    await cold.browser.waitUntil(
      async () => !parse(readFileSync(metadataPath, "utf8")).pendingTurn,
      { timeout: 15_000 },
    );
    const saved = entries(join(directory, "transcript.jsonl"));
    assert.ok(
      saved.some(
        (entry) =>
          entry.type === "message" &&
          entry.role === "assistant" &&
          entry.text.trim() === "Recovered local transcript passed",
      ),
    );
    assert.equal(
      saved.filter((entry) => entry.role === "user" && entry.text === prompt)
        .length,
      1,
    );
    assert.equal(
      saved.filter(
        (entry) => entry.type === "error" && entry.retryable === false,
      ).length,
      1,
    );
    assert.equal(saved.filter((entry) => entry.role === "user").length, 2);
    assert.equal(
      readFileSync(join(vault, "Note.md"), "utf8"),
      "# Preserved recovery note\n",
    );
    await cold.close(true);
    console.log(`Native local recovery evidence: ${root}`);
  },
);
