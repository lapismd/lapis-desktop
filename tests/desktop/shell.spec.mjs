import { browser, expect } from "@wdio/globals";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("actual native desktop shell", () => {
  before(async () => {
    await browser.waitUntil(() =>
      browser.execute(
        () => document.documentElement.dataset.shellReady === "true",
      ),
    );
  });
  it("cold boots branded ready content through the actual Rust handshake", async () => {
    const info = await browser.tauri.execute(({ core }) =>
      core.invoke("shell_info"),
    );
    assert.equal(info.runtime, "tauri-desktop");
    assert.equal(info.os, "macos");
    assert.equal(info.ready, true);
    const shared = await browser.execute(() => ({
      stateDirectory: document.documentElement.dataset.appStateDirectory,
      runtime: document.documentElement.dataset.lapisRuntime,
      classification: document.documentElement.dataset.runtimeClass,
    }));
    assert.deepEqual(shared, {
      stateDirectory: ".lapis",
      runtime: "tauri-desktop",
      classification: "desktop",
    });
    await expect(browser.$("h1")).toHaveText("A new home for your notes");
    assert.equal(await browser.execute(() => location.protocol), "tauri:");
  });
  it("keeps privileged native commands unavailable", async () => {
    const denied = await browser.tauri.execute(async ({ core }) => {
      try {
        await core.invoke("plugin:window|set_title", {
          label: "main",
          title: "Unexpected",
        });
        return false;
      } catch {
        return true;
      }
    });
    assert.equal(denied, true);
  });
  it("resizes the native window and retains usable content and traffic-light inset", async () => {
    await browser.execute(async () => {
      const { window, dpi } = globalThis.__TAURI__;
      await window.getCurrentWindow().setSize(new dpi.LogicalSize(640, 480));
    });
    await browser.waitUntil(
      async () => (await browser.execute(() => innerWidth)) === 640,
    );
    const geometry = await browser.execute(() => {
      const header = document.querySelector("header");
      return {
        inset: getComputedStyle(header).paddingInlineStart,
        height: header.getBoundingClientRect().height,
        overflow: document.documentElement.scrollWidth > innerWidth,
        drag: header.hasAttribute("data-tauri-drag-region"),
      };
    });
    assert.deepEqual(geometry, {
      inset: "80px",
      height: 40,
      overflow: false,
      drag: true,
    });
  });
  it("moves the actual native window", async () => {
    await browser.execute(async () => {
      const { window, dpi } = globalThis.__TAURI__;
      const current = window.getCurrentWindow();
      await current.setSize(new dpi.LogicalSize(900, 640));
      await current.setPosition(new dpi.LogicalPosition(160, 100));
    });
    const position = await browser.execute(() =>
      globalThis.__TAURI__.window.getCurrentWindow().outerPosition(),
    );
    assert.equal(
      position.x,
      160 * (await browser.execute(() => devicePixelRatio)),
    );
  });
  it("has no accessibility violations in the actual WebView", async () => {
    await browser.execute(
      readFileSync(
        new URL("../../node_modules/axe-core/axe.min.js", import.meta.url),
        "utf8",
      ),
    );
    const violations = await browser.executeAsync((done) => {
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
            })),
          ),
        );
    });
    assert.deepEqual(violations, []);
  });
});
