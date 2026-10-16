import { browser, expect } from "@wdio/globals";
import { Key } from "webdriverio";
import assert from "node:assert/strict";
import { join } from "node:path";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const profile = process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT;
const root = join(profile, "vault-笔记 café");
const content = "# Native edit persisted\n\n![Local attachment](café.png)\n";

describe("real Notes native session", () => {
  afterEach(async function () {
    if (this.currentTest.state === "failed") {
      const problems = browser.$('button[aria-label$=" problems"]');
      if (await problems.isExisting()) await problems.click();
      console.error(
        "Notes UI failure:",
        await browser.execute(() => ({
          text: document.body.innerText,
          gutter: document.querySelector(".cm-gutters")?.outerHTML,
          images: [...document.querySelectorAll(".notes-session img")].map(
            (image) => ({
              html: image.outerHTML,
              source: image.currentSrc,
              width: image.naturalWidth,
            }),
          ),
          buttons: [...document.querySelectorAll(".notes-session button")].map(
            (button) => ({
              name: button.textContent,
              label: button.getAttribute("aria-label"),
              title: button.title,
            }),
          ),
        })),
      );
    }
  });
  it("mounts the public Notes workspace for an admitted real folder", async () => {
    await browser.waitUntil(() =>
      browser.execute(
        () => document.documentElement.dataset.shellReady === "true",
      ),
    );
    writeFileSync(
      join(root, "Native Note.md"),
      "# Native Note\n\n![Local attachment](café.png)\n",
    );
    writeFileSync(join(profile, "picker.json"), JSON.stringify(root));
    await browser.$("button=Open vault…").click();
    await browser.$("button=Open notes").click();
    await browser.waitUntil(() =>
      browser.$('[data-notes-ready="true"]').isExisting(),
    );
    await expect(
      browser.$('[data-ui-component="lapis-workspace-shell"]'),
    ).toBeDisplayed();
    assert.equal(existsSync(join(root, ".lapis")), true);
    assert.equal(existsSync(join(root, ".lapis/app.json")), true);
    assert.equal(existsSync(join(root, ".obsidian")), false);
  });

  it("opens a real Markdown note through File Explorer", async () => {
    await browser.$('[data-path="Native Note.md"]').click();
    await expect(
      browser.$('.cm-content[contenteditable="true"]'),
    ).toBeDisplayed();
  });

  it("edits in the real editor and saves the complete note to native disk", async () => {
    await browser.$('.cm-content[contenteditable="true"]').click();
    await browser.keys([Key.Command, "a"]);
    await browser.keys(Key.NULL);
    await browser.$('.cm-content[contenteditable="true"]').addValue(content);
    await browser.keys([Key.Command, "s"]);
    await browser.keys(Key.NULL);
    await browser.waitUntil(
      () => readFileSync(join(root, "Native Note.md"), "utf8") === content,
    );
  });

  it(
    "has no accessibility violations while editing the real note",
    assertWorkspaceAccessibility,
  );

  it("renders a vault attachment in the real Markdown view", async () => {
    await browser
      .$('button[aria-label="Open Native Note.md tab menu"]')
      .click();
    await browser.$("span=Reading view").click();
    await browser.waitUntil(() =>
      browser.execute(() =>
        [...document.querySelectorAll(".notes-session img")].some(
          (image) =>
            image.currentSrc.startsWith("lapis-vault:") &&
            image.naturalWidth > 0 &&
            `${image.alt} ${image.closest("figure")?.textContent ?? ""}`.includes(
              "Local attachment",
            ),
        ),
      ),
    );
  });

  it(
    "has no accessibility violations while reading the real note",
    assertWorkspaceAccessibility,
  );

  async function assertWorkspaceAccessibility() {
    await browser.execute(
      readFileSync(
        new URL("../../node_modules/axe-core/axe.min.js", import.meta.url),
        "utf8",
      ),
    );
    const violations = await browser.executeAsync((done) =>
      window.axe
        .run(document, {
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
          },
        })
        .then((result) =>
          done(
            result.violations.map(({ id, nodes }) => ({
              id,
              count: nodes.length,
              targets: nodes.map(({ target, html }) => ({ target, html })),
            })),
          ),
        ),
    );
    assert.deepEqual(violations, []);
  }

  it("closes the owned database, then reopens the real Notes session with saved content", async () => {
    await browser.$("button=Back to vaults").click();
    await expect(browser.$("button=Open notes")).toBeDisplayed();
    const released = await browser.tauri.execute(async ({ core }) => {
      const [profile] = await core.invoke("vault_recents");
      const selected = await core.invoke("vault_open_recent", {
        profileId: profile.id,
      });
      const { connectionId } = await core.invoke("vault_db_open", {
        sessionId: selected.sessionId,
      });
      await core.invoke("vault_db_close", {
        sessionId: selected.sessionId,
        connectionId,
      });
      await core.invoke("vault_close", { sessionId: selected.sessionId });
      return true;
    });
    assert.equal(
      released,
      true,
      "Another admission must be able to open the released native database",
    );
    await browser.$("button=Open notes").click();
    await browser.waitUntil(() =>
      browser.$('[data-notes-ready="true"]').isExisting(),
    );
    await browser.$('[data-path="Native Note.md"]').click();
    if (
      !(await browser.$('.cm-content[contenteditable="true"]').isDisplayed())
    ) {
      await browser
        .$('button[aria-label="Open Native Note.md tab menu"]')
        .click();
      await browser.$("span=Reading view").click();
    }
    await expect(browser.$('.cm-content[contenteditable="true"]')).toHaveText(
      expect.stringContaining("Native edit persisted"),
    );
    assert.equal(readFileSync(join(root, "Native Note.md"), "utf8"), content);
    await browser.$("button=Back to vaults").click();
    await browser.$("button=Close vault").click();
  });
});
