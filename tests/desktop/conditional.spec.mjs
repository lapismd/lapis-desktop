import { browser } from "@wdio/globals";
import assert from "node:assert/strict";
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  unlinkSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";

const profile = process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT;
const root = join(profile, "conditional-笔记 café");
const path = "café.md";
const baseline = "# Original 笔记\n";
const local = "# Local changes 🪨\n";
const external = "# Saved by another app\n";
const write = (expected, data, name = path) =>
  browser.execute(
    (root, name, expected, data) =>
      globalThis.__lapisConditionalWriteAcceptance.write(
        root,
        name,
        expected,
        data,
      ),
    root,
    name,
    expected,
    data,
  );

describe("public native conditional text writes", () => {
  before(async () => {
    mkdirSync(root);
    writeFileSync(join(root, path), baseline);
    await browser.$("button=Open vault…").waitForEnabled();
    writeFileSync(join(profile, "picker.json"), JSON.stringify(root));
    await browser.$("button=Open vault…").click();
    await browser.waitUntil(
      async () =>
        (await browser.$(".vault-location").getText()) === root &&
        (await browser.$("button=Close vault").isEnabled()),
    );
  });

  it("uses the public capability and commits matching Unicode contents", async () => {
    assert.equal(
      await browser.execute(
        (root) => globalThis.__lapisConditionalWriteAcceptance.available(root),
        root,
      ),
      true,
    );
    assert.deepEqual(await write(baseline, local), { ok: true });
    assert.equal(readFileSync(join(root, path), "utf8"), local);
  });

  it("preserves an external edit and returns the native portable conflict code", async () => {
    writeFileSync(join(root, path), external);
    const result = await write(local, "# An unsafe overwrite\n");
    assert.equal(result.ok, false);
    assert.equal(result.code, "ECONFLICT");
    assert.equal(readFileSync(join(root, path), "utf8"), external);
  });

  it("distinguishes expected absence from a deleted or newly appeared file", async () => {
    assert.deepEqual(await write(null, "created", "created.md"), { ok: true });
    assert.equal(
      (await write(null, "must not replace", "created.md")).code,
      "ECONFLICT",
    );
    assert.equal(readFileSync(join(root, "created.md"), "utf8"), "created");
    unlinkSync(join(root, "created.md"));
    assert.equal(
      (await write("created", "must not recreate", "created.md")).code,
      "ECONFLICT",
    );
    assert.equal(existsSync(join(root, "created.md")), false);
  });

  after(async () => {
    await browser.$("button=Close vault").click();
  });
});
