import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { nativeSession } from "./native-session.mjs";

const panel = '[aria-label="Repository history"]';
const graph = `${panel} ol[aria-label="Revision graph"]`;
const ids = (browser) =>
  browser.execute(
    (selector) =>
      Array.from(
        document.querySelectorAll(
          `${selector} > li > .repository-graph-row button[data-side="commit"]`,
        ),
        (button) =>
          button
            .getAttribute("aria-label")
            ?.match(/Copy Git commit SHA ([0-9a-f]{40})$/u)?.[1],
      ).filter(Boolean),
    graph,
  );
async function ready(browser) {
  await browser
    .$('[data-notes-ready="true"]')
    .waitForDisplayed({ timeout: 30000 });
  assert.equal(
    await browser.$('button[aria-label^="Vault history:"]').isExisting(),
    false,
  );
}
async function advanced(browser, previous) {
  let commits;
  await browser.waitUntil(
    async () => {
      commits = await ids(browser);
      return commits.some((id) => !previous.includes(id));
    },
    {
      timeout: 30000,
      timeoutMsg:
        "Unpinned JJ Log must follow automatic captures without the status control",
    },
  );
  return commits;
}

test(
  "cold unpinned JJ Log follows automatic file history while the status control is hidden",
  { timeout: 120000 },
  async (context) => {
    const parent = resolve(
      process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT ?? ".local/native-test",
    );
    mkdirSync(parent, { recursive: true });
    const root = mkdtempSync(join(parent, "live-hidden-history-"));
    const vault = join(root, "Live notes");
    mkdirSync(join(vault, ".lapis"), { recursive: true });
    writeFileSync(
      join(vault, ".lapis/core-plugins.json"),
      JSON.stringify({ disabled: ["ai"], enabled: [] }),
    );
    writeFileSync(
      join(vault, ".lapis/repository-history.json"),
      JSON.stringify({ showWorkingCopyStatus: false }),
    );
    const file = join(vault, "Note.md");
    writeFileSync(file, "# Initial automatically retained note\n");
    const first = await nativeSession("live-history-hidden", root);
    context.after(first.cleanup);
    writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
    await first.browser.$("button*=Open Vault").click();
    await ready(first.browser);
    const open = first.browser.$('button[aria-label="Repository History"]');
    if (!(await open.isDisplayed()))
      await first.browser.$('button[aria-label="Open left sidebar"]').click();
    await open.click();
    await first.browser.$(graph).waitForDisplayed({ timeout: 30000 });
    await first.browser.waitUntil(
      async () => (await ids(first.browser)).length >= 2,
      { timeout: 30000 },
    );
    const initial = await ids(first.browser);
    writeFileSync(file, "# Live capture without a status control\n");
    const firstAdvance = await advanced(first.browser, initial);
    assert.equal(
      await first.browser
        .$(`${graph} button[aria-expanded="true"]`)
        .isExisting(),
      false,
    );
    await first.close(true);
    const cold = await nativeSession("live-history-hidden-reopen", root);
    context.after(cold.cleanup);
    await ready(cold.browser);
    await cold.browser.$(graph).waitForDisplayed({ timeout: 30000 });
    const before = await ids(cold.browser);
    const final = "# Live capture after cold restoration\n";
    writeFileSync(file, final);
    const after = await advanced(cold.browser, before);
    assert.equal(
      await cold.browser
        .$(`${graph} button[aria-expanded="true"]`)
        .isExisting(),
      false,
    );
    // The first row is JJ's new empty working-copy child; the next is the saved checkpoint.
    await cold.browser
      .$(`${graph} > li:nth-child(2) button.repository-graph-select`)
      .click();
    const path = cold.browser
      .$(panel)
      .$('[aria-label="Changed files"]')
      .$("button*=Note.md");
    await path.waitForDisplayed({ timeout: 30000 });
    await path.click();
    const diff = cold.browser.$(panel).$('[aria-label="Changes to Note.md"]');
    await diff.waitForDisplayed({ timeout: 30000 });
    assert.match(await diff.getText(), /Live capture after cold restoration/u);
    assert.equal(readFileSync(file, "utf8"), final);
    writeFileSync(
      join(root, "live-history-receipt.json"),
      JSON.stringify({ initial, firstAdvance, before, after }, null, 2) + "\n",
    );
    await cold.close();
  },
);
