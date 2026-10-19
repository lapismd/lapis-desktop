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
import { parse } from "yaml";
import { nativeSession } from "./native-session.mjs";

const configuration = process.env.LAPIS_AI_TEST_RUNTIME_CONFIG;
const executable = resolve(
  "src-tauri/target/debug/bundle/macos/Lapis Notes Acceptance.app/Contents/MacOS/lapis-desktop",
);
const lines = 500;
const prompt = `Do not use tools or inspect files. Output only the integers 1 through ${lines}, one per line, without a code fence or any other text.`;
function metadataFiles(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? metadataFiles(join(root, entry.name))
      : entry.name === "metadata.yaml"
        ? [join(root, entry.name)]
        : [],
  );
}
function entries(path) {
  return readFileSync(path, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map(JSON.parse);
}
test(
  "real local Codex completes and saves an ordinary streamed response without losing coverage",
  { skip: !configuration, timeout: 180_000 },
  async (context) => {
    process.env.LAPIS_DESKTOP_ACCEPTANCE_NATIVE_AI = "1";
    const parent = resolve(".local/native-test");
    mkdirSync(parent, { recursive: true });
    const root = mkdtempSync(join(parent, "ai-local-streaming-"));
    const vault = join(root, "Streaming Notes");
    mkdirSync(vault);
    writeFileSync(join(vault, "Note.md"), "# Preserved streaming note\n");
    mkdirSync(join(root, "profile"));
    copyFileSync(configuration, join(root, "profile/ai-runtime.json"));
    const session = await nativeSession(
      "ai-local-streaming",
      root,
      executable,
      [],
      { background: true },
    );
    context.after(async () => {
      if (session.isRunning()) {
        const text = await session.browser
          .execute(() => document.body.innerText)
          .catch(String);
        writeFileSync(join(root, "ui.txt"), text);
      }
      await session.cleanup();
    });
    const info = await session.browser.execute(() =>
      globalThis.__TAURI__.core.invoke("shell_info"),
    );
    assert.equal(info.nativeAiPolicy, true);
    writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
    await session.browser.$("button*=Open Vault").click();
    await session.browser.$('[data-notes-ready="true"]').waitForDisplayed();
    await session.browser.$('button[aria-label="Open Chat"]').click();
    await session.browser
      .$(
        '[data-testid="ai-chat-panel"][data-initializing="false"][data-model-catalog-loading="false"]',
      )
      .waitForDisplayed({ timeout: 45_000 });
    await session.browser
      .$('[contenteditable="true"][aria-label="Message"]')
      .addValue(prompt);
    await session.browser.$('button[aria-label="Send message"]').click();
    let metadata;
    let seenPending = false;
    await session.browser.waitUntil(
      async () => {
        try {
          metadata = metadataFiles(vault)[0];
          if (!metadata) return false;
          const pending = parse(readFileSync(metadata, "utf8")).pendingTurn;
          seenPending ||= Boolean(pending);
          const transcript = entries(
            join(dirname(metadata), "transcript.jsonl"),
          );
          return (
            seenPending &&
            (!pending || transcript.some((entry) => entry.type === "error"))
          );
        } catch {
          return false;
        }
      },
      { timeout: 120_000, interval: 100 },
    );
    const transcript = entries(join(dirname(metadata), "transcript.jsonl"));
    assert.deepEqual(
      transcript.filter((entry) => entry.type === "error"),
      [],
      "Ordinary output must preserve complete coverage",
    );
    assert.equal(parse(readFileSync(metadata, "utf8")).pendingTurn, undefined);
    assert.deepEqual(
      transcript
        .filter((entry) => entry.role === "user")
        .map((entry) => entry.text),
      [prompt],
    );
    const response = transcript
      .filter((entry) => entry.role === "assistant")
      .map((entry) => entry.text)
      .join("");
    assert.equal(
      response.trim(),
      Array.from({ length: lines }, (_, index) => String(index + 1)).join("\n"),
    );
    assert.equal(
      readFileSync(join(vault, "Note.md"), "utf8"),
      "# Preserved streaming note\n",
    );
    await session.close(true);
    console.log(`Native streaming evidence: ${root}`);
  },
);
