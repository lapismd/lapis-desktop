import { returnToVaults } from "./workspace-navigation.mjs";
import { browser, expect } from "@wdio/globals";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const profile = process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT;
const root = join(profile, "vault-笔记 café");
const queue = (path) =>
  writeFileSync(join(profile, "picker.json"), JSON.stringify(path));
const idle = () =>
  browser.waitUntil(
    async () =>
      (await browser
        .$('section[aria-label="Vaults"]')
        .getAttribute("aria-busy")) === "false",
  );
let admission;
let resourceUrl;

describe("actual native vault access", () => {
  before(async () => {
    await browser.waitUntil(() =>
      browser.execute(
        () => document.documentElement.dataset.shellReady === "true",
      ),
    );
    await idle();
  });

  it("cancels a native selection request without changing profiles or mounting Notes", async () => {
    const before = await browser.tauri.execute(({ core }) =>
      core.invoke("vault_recents"),
    );
    queue(null);
    await browser.$("button*=Open Vault").click();
    await idle();
    assert.deepEqual(
      await browser.tauri.execute(({ core }) => core.invoke("vault_recents")),
      before,
    );
    assert.equal(await browser.$(".notes-session").isExisting(), false);
    await expect(browser.$("h1")).toHaveText("Create a vault");
  });

  it("opens a real Unicode folder directly in Notes and lists its actual files", async () => {
    queue(root);
    await browser.$("button*=Open Vault").click();
    await browser.$('[data-notes-ready="true"]').waitForDisplayed();
    await expect(
      browser.$('button[aria-label="Current workspace: vault-笔记 café"]'),
    ).toBeDisplayed();
    admission = await browser.tauri.execute(async ({ core }) => {
      const [recent] = await core.invoke("vault_recents");
      return core.invoke("vault_open_recent", { profileId: recent.id });
    });
    assert.equal(admission.path, root);
    const listing = await browser.tauri.execute(
      ({ core }, selected) =>
        core.invoke("vault_fs", {
          sessionId: selected.sessionId,
          request: { operation: "list", path: "" },
        }),
      admission,
    );
    assert.ok(listing.files.includes("Welcome.md"));
    assert.ok(listing.files.length + listing.folders.length <= 2000);
    await returnToVaults(browser);
    await browser.$("[data-desktop-vault-launcher]").waitForDisplayed();
    assert.equal(await browser.$("button=Open notes").isExisting(), false);
  });

  it("round trips text, binary and .lapis state through admitted Rust commands", async () => {
    const result = await browser.tauri.execute(async ({ core }, selected) => {
      const fs = (request) =>
        core.invoke("vault_fs", { sessionId: selected.sessionId, request });
      await fs({ operation: "mkdir", path: ".lapis", recursive: true });
      await fs({
        operation: "write-text",
        path: ".lapis/app.json",
        data: '{"native":true}',
      });
      await fs({
        operation: "write-text",
        path: "笔记.md",
        data: "# café 🪨\n",
      });
      await fs({
        operation: "write-binary",
        path: "bytes.bin",
        data: [0, 255, 128, 42],
      });
      return {
        text: await fs({ operation: "read-text", path: "笔记.md" }),
        bytes: await fs({ operation: "read-binary", path: "bytes.bin" }),
      };
    }, admission);
    assert.deepEqual(result, { text: "# café 🪨\n", bytes: [0, 255, 128, 42] });
    assert.equal(readFileSync(join(root, "笔记.md"), "utf8"), result.text);
    assert.equal(
      readFileSync(join(root, ".lapis/app.json"), "utf8"),
      '{"native":true}',
    );
    assert.deepEqual([...readFileSync(join(root, "bytes.bin"))], result.bytes);
  });

  it("keeps generic filesystem, unknown admissions and traversal unavailable", async () => {
    const denials = await browser.tauri.execute(async ({ core }, selected) => {
      const attempts = [
        ["plugin:fs|read_file", { path: "/etc/passwd" }],
        [
          "vault_fs",
          {
            sessionId: "unknown",
            request: { operation: "read-text", path: "Welcome.md" },
          },
        ],
        [
          "vault_fs",
          {
            sessionId: selected.sessionId,
            request: { operation: "read-text", path: "../outside" },
          },
        ],
        [
          "vault_fs",
          {
            sessionId: selected.sessionId,
            request: { operation: "read-text", path: "/etc/passwd" },
          },
        ],
        [
          "vault_fs",
          {
            sessionId: selected.sessionId,
            request: {
              operation: "read-text",
              path: "Welcome.md",
              rootPath: "/etc",
            },
          },
        ],
      ];
      return Promise.all(
        attempts.map(async ([command, payload]) => {
          try {
            await core.invoke(command, payload);
            return false;
          } catch {
            return true;
          }
        }),
      );
    }, admission);
    assert.deepEqual(denials, [true, true, true, true, true]);
  });

  it("displays and fetches a binary attachment through the scoped custom protocol", async () => {
    resourceUrl = await browser.execute(
      (selected) =>
        globalThis.__TAURI__.core.convertFileSrc(
          `${selected.resourceToken}/café.png`,
          "lapis-vault",
        ),
      admission,
    );
    const result = await browser.executeAsync((url, done) => {
      const image = document.createElement("img");
      image.alt = "Native attachment acceptance";
      image.src = url;
      image.onload = async () => {
        try {
          const response = await fetch(url);
          done({
            width: image.naturalWidth,
            contentType: response.headers.get("Content-Type"),
            cache: response.headers.get("Cache-Control"),
            bytes: [...new Uint8Array(await response.arrayBuffer())],
          });
        } catch (error) {
          done({ error: String(error) });
        }
      };
      image.onerror = () => done({ error: "Native image did not load" });
      document.querySelector("main").append(image);
    }, resourceUrl);
    assert.ok(result.width > 0, JSON.stringify(result));
    assert.equal(result.contentType, "image/png");
    assert.equal(result.cache, "no-store");
    assert.deepEqual(result.bytes, [...readFileSync(join(root, "café.png"))]);
    await browser.execute(() =>
      document
        .querySelector('img[alt="Native attachment acceptance"]')
        .remove(),
    );
  });

  it("revokes native file and resource authority when its admission closes", async () => {
    await browser.tauri.execute(
      ({ core }, selected) =>
        core.invoke("vault_close", { sessionId: selected.sessionId }),
      admission,
    );
    const status = await browser.executeAsync(
      (url, done) =>
        fetch(url)
          .then((response) => done(response.status))
          .catch(() => done("rejected")),
      resourceUrl,
    );
    assert.equal(status, 404);
    const denied = await browser.tauri.execute(async ({ core }, selected) => {
      try {
        await core.invoke("vault_fs", {
          sessionId: selected.sessionId,
          request: { operation: "read-text", path: "Welcome.md" },
        });
        return false;
      } catch {
        return true;
      }
    }, admission);
    assert.equal(denied, true);
  });

  it("retains a live admission and recent profiles after cancellation and a create collision", async () => {
    const before = await browser.tauri.execute(({ core }) =>
      core.invoke("vault_recents"),
    );
    const retained = await browser.tauri.execute(
      ({ core }, id) => core.invoke("vault_open_recent", { profileId: id }),
      admission.profileId,
    );
    queue(null);
    await browser.$("button*=Open Vault").click();
    await idle();
    queue(root);
    await browser.$("button*=Create New Vault").click();
    await idle();
    await expect(browser.$('[role="alert"]')).toBeDisplayed();
    assert.deepEqual(
      await browser.tauri.execute(({ core }) => core.invoke("vault_recents")),
      before,
    );
    const content = await browser.tauri.execute(
      ({ core }, selected) =>
        core.invoke("vault_fs", {
          sessionId: selected.sessionId,
          request: { operation: "read-text", path: "Welcome.md" },
        }),
      retained,
    );
    assert.equal(content, "# A native vault\n");
    assert.equal(readFileSync(join(root, "Welcome.md"), "utf8"), content);
    await browser.tauri.execute(
      ({ core }, selected) =>
        core.invoke("vault_close", { sessionId: selected.sessionId }),
      retained,
    );
  });

  it("creates, closes and reopens a recent vault and reports a missing folder", async () => {
    const created = join(profile, "New Notes");
    queue(created);
    await browser.$("button*=Create New Vault").click();
    await browser.$('[data-notes-ready="true"]').waitForDisplayed();
    await expect(
      browser.$('button[aria-label="Current workspace: New Notes"]'),
    ).toBeDisplayed();
    await returnToVaults(browser);
    await browser.$("[data-desktop-vault-launcher]").waitForDisplayed();
    const recent = () => browser.$('[data-ui-part="recent-open"]*=New Notes');
    await recent().click();
    await browser.$('[data-notes-ready="true"]').waitForDisplayed();
    await returnToVaults(browser);
    await browser.$("[data-desktop-vault-launcher]").waitForDisplayed();
    rmSync(created, { recursive: true });
    await recent().click();
    await idle();
    await expect(browser.$('[role="alert"]')).toBeDisplayed();
    assert.equal(await browser.$(".notes-session").isExisting(), false);
  });

  it("exposes semantic keyboard controls with no axe violations", async () => {
    await browser.$("button*=Open Vault").waitForEnabled();
    const controls = await browser.execute(() =>
      [
        ...document.querySelectorAll("[data-desktop-vault-launcher] button"),
      ].map((button) => ({
        name: button.textContent.trim(),
        tabIndex: button.tabIndex,
        disabled: button.disabled,
      })),
    );
    assert.ok(controls.length >= 2);
    assert.ok(
      controls.every(
        (button) => button.name && button.tabIndex === 0 && !button.disabled,
      ),
    );
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
        .then((result) => done(result.violations.map(({ id }) => id))),
    );
    assert.deepEqual(violations, []);
  });
});
