import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { nativeSession } from "./native-session.mjs";

async function nativeControlsCentered(browser) {
  let measured;
  await browser
    .waitUntil(
      async () => {
        const info = await browser.execute(() =>
          globalThis.__TAURI__.core.invoke("shell_info"),
        );
        const controls = info.nativeControls?.Ok;
        measured = info.nativeControls;
        return (
          controls?.length === 3 &&
          controls.every(
            ([x, top, width, height]) =>
              x >= 16 &&
              x + width <= 80 &&
              Math.abs(top + height / 2 - 20) < 0.5,
          )
        );
      },
      {
        timeout: 5000,
        timeoutMsg:
          "Actual native traffic lights must remain centered at y=20 with their 16px inset",
      },
    )
    .catch((error) => {
      throw new Error(`${error.message}: ${JSON.stringify(measured)}`, {
        cause: error,
      });
    });
}

test("workspace tabs meet the native top edge and retain Tauri drag handles", async (context) => {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "chrome-"),
  );
  const vault = join(root, "Chrome café");
  mkdirSync(vault);
  writeFileSync(join(vault, "Welcome.md"), "# Window chrome\n");
  const session = await nativeSession("window-chrome", root);
  context.after(session.cleanup);
  const { browser } = session;
  await nativeControlsCentered(browser);
  assert.equal(await browser.$(".shell-header").isExisting(), false);
  const launcher = await browser.execute(() => {
    const element = document.querySelector(".shell-content");
    const bounds = element.getBoundingClientRect();
    return {
      top: bounds.top,
      height: bounds.height,
      viewport: innerHeight,
      drag: element.getAttribute("data-tauri-drag-region"),
      controls: document
        .querySelector("[data-desktop-vault-launcher-content]")
        .getAttribute("data-tauri-drag-region"),
    };
  });
  assert.equal(launcher.top, 0);
  assert.equal(launcher.height, launcher.viewport);
  assert.equal(launcher.drag, "deep");
  assert.equal(launcher.controls, "false");
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  await browser.$("button*=Open Vault").click();
  await browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await browser.$('[data-path="Welcome.md"]').click();
  await browser.$('[data-workspace-tab-strip="top"]').waitForDisplayed();
  const geometry = await browser.execute(() => ({
    header: !!document.querySelector(".shell-header, .notes-session-toolbar"),
    workspaceTop: document
      .querySelector(".notes-session-workspace")
      .getBoundingClientRect().top,
    strips: [...document.querySelectorAll("[data-workspace-tab-strip]")]
      .map((element) => ({
        top: element.getBoundingClientRect().top,
        height: element.getBoundingClientRect().height,
      }))
      .filter(({ height }) => height > 0),
    leftTab: document
      .querySelector('[data-workspace-sidebar-side="left"] [role="tab"]')
      .getBoundingClientRect().left,
    drag: document
      .querySelector('[data-workspace-tab-strip="top"]')
      .getAttribute("data-tauri-drag-region"),
    excluded: [
      ...document.querySelectorAll('[data-desktop-drag-region="false"]'),
    ].every(
      (element) => element.getAttribute("data-tauri-drag-region") === "false",
    ),
  }));
  assert.equal(geometry.header, false);
  assert.equal(geometry.workspaceTop, 0);
  assert.ok(geometry.strips.length >= 3);
  assert.ok(
    geometry.strips.every(({ top, height }) => top === 0 && height === 40),
  );
  assert.ok(geometry.leftTab >= 80);
  assert.equal(geometry.drag, "deep");
  assert.equal(geometry.excluded, true);
  for (const [width, height] of [
    [900, 640],
    [1040, 720],
    [900, 640],
  ]) {
    await browser.execute(
      async (width, height) => {
        const { window, dpi } = globalThis.__TAURI__;
        await window
          .getCurrentWindow()
          .setSize(new dpi.LogicalSize(width, height));
        await window.getCurrentWindow().setFocus();
      },
      width,
      height,
    );
    await browser.waitUntil(() =>
      browser.execute((width) => innerWidth === width, width),
    );
    await browser.executeAsync((done) =>
      requestAnimationFrame(() => requestAnimationFrame(() => done(true))),
    );
    await nativeControlsCentered(browser);
  }
  await browser.$('button[aria-label="Close left sidebar"]').click();
  const reopen = browser.$('button[aria-label="Open left sidebar"]');
  await reopen.waitForDisplayed();
  assert.ok((await reopen.getLocation()).x >= 65);
  await reopen.click();
  await browser.$('[data-workspace-sidebar-side="left"]').waitForDisplayed();
  await browser.execute(() => {
    const region = document.createElement("div");
    region.id = "native-drag-contract";
    region.setAttribute("data-desktop-drag-region", "");
    region.innerHTML =
      '<span id="drag-background">Drag</span><button id="drag-button">Control</button><div id="drag-excluded" data-desktop-drag-region="false"><span id="drag-excluded-child">Excluded</span></div>';
    document.body.append(region);
  });
  await browser.waitUntil(() =>
    browser.execute(
      () =>
        document
          .getElementById("native-drag-contract")
          .getAttribute("data-tauri-drag-region") === "deep" &&
        document
          .getElementById("drag-excluded")
          .getAttribute("data-tauri-drag-region") === "false",
    ),
  );
  await browser.execute(() =>
    document
      .getElementById("native-drag-contract")
      .setAttribute("data-desktop-drag-region", "false"),
  );
  await browser.waitUntil(() =>
    browser.execute(
      () =>
        document
          .getElementById("native-drag-contract")
          .getAttribute("data-tauri-drag-region") === "false",
    ),
  );
  await browser.execute(() =>
    document.getElementById("native-drag-contract").remove(),
  );
  await session.close();
  const restored = await nativeSession("window-chrome-restored", root);
  context.after(restored.cleanup);
  await nativeControlsCentered(restored.browser);
  await restored.close();
});
