import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const prepare = fileURLToPath(
  new URL("../../scripts/prepare-cli.mjs", import.meta.url),
);
test(
  "Linux CLI staging cannot reuse another source revision's cached executable",
  {
    skip: process.platform !== "linux" ? "Linux executable fixture" : false,
  },
  async (context) => {
    const root = await mkdtemp(join(tmpdir(), "lapis-cli-preparation-"));
    context.after(() => rm(root, { recursive: true, force: true }));
    const bin = join(root, "bin"),
      state = join(root, "source.json");
    await mkdir(bin);
    await mkdir(join(root, "src-tauri"));
    await writeFile(
      join(bin, "cargo"),
      `#!${process.execPath}
const fs = require("node:fs"), path = require("node:path");
const state = JSON.parse(fs.readFileSync(${JSON.stringify(state)}, "utf8"));
const args = process.argv.slice(2);
if (args[0] === "metadata") {
  process.stdout.write(JSON.stringify({ packages: [{ name: "lapis-app-core", source: "git+https://example.invalid/server#" + state.revision, manifest_path: path.join(state.source, "crates/lapis-app-core/Cargo.toml") }] }));
} else if (args[0] === "build") {
  const output = path.join(args[args.indexOf("--target-dir") + 1], args[args.indexOf("--target") + 1], "release/lapis");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  // Model an immutable-source Cargo cache hit when the output is shared.
  if (!fs.existsSync(output)) fs.writeFileSync(output, "#!/bin/sh\\n# source " + state.revision + "\\nexit 0\\n", { mode: 0o755 });
} else process.exit(2);
`,
      { mode: 0o755 },
    );
    const run = (...args) =>
      spawnSync(process.execPath, [prepare, ...args], {
        cwd: root,
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: `${bin}:${process.env.PATH}`,
          RELEASE_TARGET: "x86_64-unknown-linux-gnu",
        },
      });
    for (const revision of ["a".repeat(40), "b".repeat(40)]) {
      const source = join(root, "sources", revision);
      await mkdir(join(source, "crates/lapis-cli"), { recursive: true });
      await writeFile(
        join(source, "crates/lapis-cli/Cargo.toml"),
        'version = "0.1.0"\n',
      );
      await writeFile(state, JSON.stringify({ revision, source }));
      await writeFile(
        join(root, "src-tauri/Cargo.toml"),
        `lapis-app-core = { git = "https://example.invalid/server", rev = "${revision}" }\n`,
      );
      const built = run();
      assert.equal(built.status, 0, built.stderr);
      const resource = join(root, "src-tauri/resources/lapis-cli");
      assert.equal(
        JSON.parse(await readFile(join(resource, "manifest.json"), "utf8"))
          .sourceRevision,
        revision,
      );
      assert.match(
        await readFile(join(resource, "lapis"), "utf8"),
        new RegExp(revision),
        "Staged executable must contain the selected source, not an older cache hit",
      );
      assert.equal(run("--reuse").status, 0);
    }
    await writeFile(
      join(root, "src-tauri/resources/lapis-cli/lapis"),
      "tampered",
    );
    assert.notEqual(run("--reuse").status, 0);
  },
);
