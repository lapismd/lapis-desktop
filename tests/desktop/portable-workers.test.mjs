import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { nativeSession } from "./native-session.mjs";
import { returnToVaults } from "./workspace-navigation.mjs";
import { seedVerifiedPortablePlugins } from "./portable-fixtures.mjs";

for (const { id, text, diagnostic } of [
  { id: "lapis-markdown-lint", text: "#Heading\n", diagnostic: "MD018" },
  {
    id: "spellcheck",
    text: "This documment has a misspeled word.\n",
    diagnostic: "harper",
  },
]) {
  test(
    `packaged ${id} runs its production worker and releases it on disable and vault return`,
    { timeout: 90000 },
    async (context) => {
      const root = mkdtempSync(
        join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "worker-"),
      );
      const vault = join(root, "Worker vault");
      mkdirSync(vault);
      seedVerifiedPortablePlugins(vault, [id]);
      writeFileSync(join(vault, "Review.md"), text);
      writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
      const session = await nativeSession(id, root);
      context.after(session.cleanup);
      const { browser } = session;
      await browser.$("button*=Open Vault").click();
      await browser.$('[data-notes-ready="true"]').waitForDisplayed();
      const baselineWorkers = await browser.execute(
        () => globalThis.__lapisPluginAcceptance.workers().active,
      );
      await browser.$('[data-path="Review.md"]').click();
      await browser.$('.cm-content[contenteditable="true"]').waitForDisplayed();
      const active = () =>
        browser.execute(
          ({ id, baselineWorkers }) =>
            globalThis.__lapisPluginAcceptance
              .workers()
              .active.filter(
                (url) =>
                  url.includes(`/${id}/`) ||
                  (id === "spellcheck" &&
                    url.startsWith("blob:tauri://localhost/") &&
                    !baselineWorkers.includes(url)),
              ),
          { id, baselineWorkers },
        );
      try {
        await browser.waitUntil(async () => (await active()).length > 0, {
          timeout: 30000,
          timeoutMsg: `${id} must start its installed module worker`,
        });
      } catch (error) {
        console.error(
          "Native worker state",
          await browser.execute(
            (id) => ({
              workers: globalThis.__lapisPluginAcceptance.workers(),
              plugin: globalThis.__lapisPluginAcceptance.state(id),
              text: document.body.innerText,
            }),
            id,
          ),
        );
        throw error;
      }
      await browser.$('[data-status-bar-item-id="app-shell:problems"]').click();
      const problems = browser.$('[data-ui-component="workspace-problems"]');
      await problems.waitForDisplayed();
      await browser.waitUntil(
        async () => (await problems.getText()).includes(diagnostic),
        { timeout: 45000, timeoutMsg: `${id} must publish ${diagnostic}` },
      );
      assert.equal(
        (await problems.getText()).includes("did not complete"),
        false,
      );
      const workerUrl = (await active())[0];
      const headers = workerUrl.startsWith("blob:")
        ? await browser.execute((url) => {
            const record = globalThis.__lapisPluginAcceptance
              .workers()
              .resources.find((item) => item.url === url);
            if (!record)
              throw new Error("No pre-revocation Blob worker receipt");
            return record;
          }, workerUrl)
        : await browser.execute(async (url) => {
            const response = await fetch(url);
            return {
              status: response.status,
              mime: response.headers.get("Content-Type"),
              corp: response.headers.get("Cross-Origin-Resource-Policy"),
            };
          }, workerUrl);
      assert.equal(headers.status, 200);
      assert.ok(headers.mime?.startsWith("text/javascript"), headers.mime);
      if (!workerUrl.startsWith("blob:"))
        assert.equal(headers.corp, "same-origin");
      if (id === "spellcheck") {
        const receipt = JSON.parse(
          readFileSync(
            process.env.LAPIS_DESKTOP_PORTABLE_FIXTURES ??
              resolve(".local/m83/portable-candidates/manifest.json"),
            "utf8",
          ),
        );
        const files = receipt.entries.find((entry) => entry.pluginId === id)
          .record.files;
        const binary = files.find((file) =>
          /assets\/binary-.*\.mjs$/.test(file.path),
        );
        assert.ok(binary, "Harper's signed binary module must be present");
        const plugin = await browser.execute(
          (id) => globalThis.__lapisPluginAcceptance.state(id),
          id,
        );
        const installation = new URL(".", plugin.diagnostics.pluginAssetUrl)
          .href;
        const result = await browser.execute(async (url) => {
          const source = await (await fetch(url)).text();
          const wasm = source.match(
            /data:application\/wasm;base64,[A-Za-z0-9+/=]+/,
          )?.[0];
          if (!wasm)
            throw new Error("Signed Harper module has no embedded WASM");
          const response = await fetch(wasm);
          return {
            status: response.status,
            mime: response.headers.get("Content-Type"),
            size: (await response.arrayBuffer()).byteLength,
          };
        }, installation + binary.path);
        assert.equal(result.status, 200);
        assert.equal(result.mime, "application/wasm");
        assert.ok(result.size > 1000000);
      }
      await browser.execute(
        (id) => globalThis.__lapisPluginAcceptance.enabled(id, false),
        id,
      );
      await browser.waitUntil(async () => (await active()).length === 0, {
        timeout: 5000,
      });
      await browser.waitUntil(
        async () => !(await problems.getText()).includes(diagnostic),
        { timeout: 5000 },
      );
      await browser.execute(
        (id) => globalThis.__lapisPluginAcceptance.enabled(id, true),
        id,
      );
      await browser.waitUntil(async () => (await active()).length > 0, {
        timeout: 30000,
      });
      await returnToVaults(browser);
      await browser.$("[data-desktop-vault-launcher]").waitForDisplayed();
      assert.deepEqual(await active(), []);
      await session.close();
    },
  );
}
