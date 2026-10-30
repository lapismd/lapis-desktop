import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { jj } from "../desktop/repository-driver.mjs";
import { nativeTurnFixture } from "../desktop/native-turn-fixture.mjs";
import { nativeQueueFixture } from "../desktop/native-queue-fixture.mjs";

test("repository fixtures use the selected runner JJ binary outside Homebrew", (context) => {
  const root = mkdtempSync(join(tmpdir(), "native-tool-path-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  const binary = join(root, "runner jj");
  writeFileSync(
    binary,
    `#!${process.execPath}\nprocess.stdout.write(JSON.stringify({fixture:true,args:process.argv.slice(2)}));\n`,
  );
  chmodSync(binary, 0o700);
  const previous = process.env.LAPIS_DESKTOP_FIXTURE_JJ;
  process.env.LAPIS_DESKTOP_FIXTURE_JJ = binary;
  try {
    const result = JSON.parse(jj(root, ["--version"]));
    assert.equal(result.fixture, true);
    assert.equal(result.args.at(-1), "--version");
  } finally {
    if (previous === undefined) delete process.env.LAPIS_DESKTOP_FIXTURE_JJ;
    else process.env.LAPIS_DESKTOP_FIXTURE_JJ = previous;
  }
});

for (const [name, factory] of [
  ["turn", nativeTurnFixture],
  ["queue", nativeQueueFixture],
]) {
  test(`native ${name} peers come from the owning Server source rather than retired Notes paths`, (context) => {
    const parent = mkdtempSync(join(tmpdir(), "native-peer-owner-"));
    context.after(() => rmSync(parent, { recursive: true, force: true }));
    const desktop = join(parent, "lapis-desktop");
    mkdirSync(desktop);
    for (const repo of ["lapis-server", "lapis-notes"]) {
      for (const kind of ["turn", "queue"]) {
        const directory = join(
          parent,
          repo,
          `crates/lapis-app-core/tests/support/native_${kind}`,
        );
        mkdirSync(directory, { recursive: true });
        writeFileSync(
          join(directory, "peer.py"),
          `# ${repo}-${kind}\nLOG = os.environ['LOG']\nRELEASE = os.environ['RELEASE']\n`,
        );
      }
    }
    const previous = process.cwd();
    process.chdir(desktop);
    try {
      const result = factory();
      const bytes = readFileSync(join(result.root, "helpers/lapis-acp"));
      assert.match(bytes.toString(), new RegExp(`lapis-server-${name}`));
      assert.doesNotMatch(bytes.toString(), /lapis-notes-/);
      const digest = createHash("sha256").update(bytes).digest("hex");
      assert.ok(
        readFileSync(
          join(result.root, "helpers/runtime-manifest.toml"),
          "utf8",
        ).includes(digest),
      );
    } finally {
      process.chdir(previous);
    }
  });
}

test("hosted native peers select the same immutable Server commit as the compiled core", () => {
  const sources = JSON.parse(readFileSync("scripts/ci-sources.json", "utf8"));
  const source = sources.find((entry) => entry.name === "lapis-server");
  assert.ok(
    source,
    "Native protocol fixture source must be present in hosted prerequisites",
  );
  const lock = readFileSync("src-tauri/Cargo.lock", "utf8");
  assert.ok(
    lock.includes(
      `git+https://github.com/lapismd/lapis-server?rev=${source.revision}#${source.revision}`,
    ),
  );
});
