import { revealConversationHistory } from "./ai-view-navigation.mjs";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";
import { parse } from "yaml";

export const records = (path) =>
  readFileSync(path, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse);
export const hash = (path) =>
  createHash("sha256").update(readFileSync(path)).digest("hex");
export const metadataFiles = (root) =>
  readdirSync(root, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? metadataFiles(join(root, entry.name))
      : entry.name === "metadata.yaml"
        ? [join(root, entry.name)]
        : [],
  );
export const journal = (metadata) =>
  join(dirname(metadata), "transcript.jsonl");
export const title = (metadata) => parse(readFileSync(metadata, "utf8")).title;

export async function panel(session) {
  const candidates = await session.browser.$$('[data-testid="ai-chat-panel"]');
  let target,
    width = -1;
  for (const candidate of candidates) {
    if (!(await candidate.isDisplayed())) continue;
    const size = await candidate.getSize();
    if (size.width > width) {
      target = candidate;
      width = size.width;
    }
  }
  return target;
}

export async function ready(session) {
  await session.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  if (!(await panel(session)))
    await session.browser.$('button[aria-label="Open Chat"]').click();
  await session.browser.waitUntil(
    async () => {
      const current = await panel(session);
      return (
        current &&
        (await current.getAttribute("data-initializing")) === "false" &&
        (await current.getAttribute("data-model-catalog-loading")) === "false"
      );
    },
    { timeout: 45_000 },
  );
}

export async function openMainChat(session) {
  await ready(session);
  await revealConversationHistory(session);
  await session.browser.$('button[aria-label="New chat in Vault"]').click();
  await session.browser.waitUntil(
    async () => {
      const main = await panel(session);
      return (
        main &&
        (await main.getSize()).width > 350 &&
        (await main.getAttribute("data-initializing")) === "false" &&
        (await main.getAttribute("data-model-catalog-loading")) === "false"
      );
    },
    { timeout: 45_000 },
  );
  const main = await panel(session);
  await main.$("button=Document").click();
  for (const side of ["left", "right"]) {
    const close = session.browser.$(
      `button[aria-label="Close ${side} sidebar"]`,
    );
    if (await close.isExisting()) await close.click();
  }
}

async function approveRead(session) {
  for (const card of await session.browser.$$(
    '[data-testid="ai-approval-card"][data-origin="runtime"]',
  )) {
    if (!(await card.isDisplayed())) continue;
    const button = card.$('button[data-approval-kind="allow-once"]');
    if (!(await button.isExisting()) || !(await button.isEnabled())) continue;
    assert.equal(
      (await card.$("strong").getText()).trim(),
      "mcp.lapis-tools.read",
    );
    await button.click();
  }
}

export async function complete(
  session,
  metadata,
  predicate,
  allowRead = false,
) {
  await session.browser.waitUntil(
    async () => {
      if (allowRead) await approveRead(session);
      const state = parse(readFileSync(metadata, "utf8"));
      return !state.pendingTurn && predicate(records(journal(metadata)));
    },
    { timeout: 90_000, interval: 100 },
  );
}

export async function send(session, text = "") {
  const main = await panel(session);
  if (text)
    await main
      .$('[contenteditable="true"][aria-label="Message"]')
      .addValue(text);
  await main.$('button[aria-label="Send message"]').click();
}

export async function commentSelection(
  session,
  reader,
  feedback,
  label = "Assistant response",
  expectedQuote,
) {
  await reader.waitForDisplayed({ timeout: 15_000 });
  await reader.scrollIntoView({ block: "center" });
  await reader.click();
  const element = await reader;
  // Ensure keyboard input targets this public reader; selection still goes
  // through the native WebView's keyboard handling rather than private state.
  await session.browser.execute((node) => node.focus(), element);
  assert.equal(
    await session.browser.execute(
      (node) => document.activeElement === node,
      element,
    ),
    true,
  );
  // The macOS WebDriver sends Home/End as literal private-use characters.
  // Exercise the public keyboard handlers in the actual WebView instead;
  // never assign a private editor selection or construct a comment capture.
  await session.browser.execute((node) => {
    const key = (value, code, options = {}) =>
      node.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: value,
          code,
          bubbles: true,
          cancelable: true,
          ...options,
        }),
      );
    key("Home", "Home");
    key("End", "End", { shiftKey: true });
    key("m", "KeyM", { ctrlKey: true, altKey: true });
  }, element);
  // The pending-context summary contains a second editor for existing drafts.
  // Use the source editor focused by the shortcut, rather than the last match.
  const editor = session.browser.$(
    `:focus[contenteditable="true"][aria-label="Comment on ${label}"]`,
  );
  await editor.waitForDisplayed({ timeout: 15_000 });
  await editor.addValue(feedback);
  if (expectedQuote !== undefined) {
    const quotes = await session.browser.execute(() =>
      [
        ...document.querySelectorAll(
          '[aria-label="Pending comments"] blockquote[data-chat-quote]',
        ),
      ].map((el) => el.getAttribute("data-chat-quote")),
    );
    assert.ok(
      quotes.includes(expectedQuote),
      `Native selection quote must match: ${JSON.stringify({ expectedQuote, quotes })}`,
    );
  }
}

export async function replyToThread(session, threadId, text) {
  const thread = session.browser.$(
    `[data-placement="inline"][data-thread-id="${threadId}"]`,
  );
  await thread.waitForDisplayed({ timeout: 15_000 });
  await thread.$('button[aria-label="Reply"]').click();
  await thread
    .$('[contenteditable="true"][aria-label="Comment on Assistant response"]')
    .addValue(text);
}

export async function openHistory(session, metadata) {
  await ready(session);
  const main = await panel(session);
  await revealConversationHistory(session, main);
  await session.browser.$(`button*=${title(metadata)}`).click();
}

export async function diagnostic(session, path) {
  if (!session.isRunning()) return;
  const { writeFileSync } = await import("node:fs");
  writeFileSync(
    path,
    await session.browser.execute(() => document.body.innerText).catch(String),
  );
  writeFileSync(
    path + ".controls.json",
    JSON.stringify(
      await session.browser
        .execute(() =>
          [...document.querySelectorAll("button")].map((b) => ({
            label: b.getAttribute("aria-label"),
            text: b.textContent,
            expanded: b.getAttribute("aria-expanded"),
          })),
        )
        .catch(String),
      null,
      2,
    ),
  );
  writeFileSync(
    path + ".tool-groups.json",
    JSON.stringify(
      await session.browser
        .execute(() =>
          [...document.querySelectorAll('[data-slot="collapsible"]')]
            .filter((node) => node.textContent?.includes("Tool activity"))
            .map((node) => node.outerHTML),
        )
        .catch(String),
      null,
      2,
    ),
  );
}
