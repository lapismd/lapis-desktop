import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, webkit } from "@playwright/test";

assert.equal(process.platform, "linux");
const directory = await mkdtemp(join(tmpdir(), "desktop-permission-smoke-"));
const denied = join(directory, "denied");
try {
  await mkdir(denied, { mode: 0o500 });
  await assert.rejects(writeFile(join(denied, "new.md"), "blocked"), {
    code: "EACCES",
  });
} finally {
  await chmod(denied, 0o700);
  await rm(directory, { recursive: true, force: true });
}
for (const tool of ["node", "pnpm", "jj", "mdbook"])
  console.log(execFileSync(tool, ["--version"], { encoding: "utf8" }).trim());
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent("<button>Container browser ready</button>");
    assert.equal(
      await page.getByRole("button").textContent(),
      "Container browser ready",
    );
  } finally {
    await browser.close();
  }
}
console.log("Container source, tools and Chromium/WebKit smoke passed.");
