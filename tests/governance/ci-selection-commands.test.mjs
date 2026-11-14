import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  unitCommands,
  qualityCommands,
  rustArguments,
} from "../../scripts/ci/commands.mjs";
test("Rust selection tests only the selected package closure", () => {
  const commands = unitCommands({
    LAPIS_CI_UNIT_GROUPS: '["rust"]',
    LAPIS_CI_RUST_PACKAGES: '["core","lapis-desktop"]',
  });
  const cargo = commands.filter(([command]) => command === "cargo");
  assert.equal(cargo.length, 1);
  assert.deepEqual(cargo[0][1].slice(-4), [
    "-p",
    "core",
    "-p",
    "lapis-desktop",
  ]);
  assert.ok(
    !qualityCommands({
      LAPIS_CI_QUALITY_GROUPS: '["rust"]',
      LAPIS_CI_RUST_PACKAGES: '["independent"]',
    }).some(([, args]) => args.includes("e2e")),
  );
  assert.ok(
    !unitCommands({
      LAPIS_CI_UNIT_GROUPS: '["rust"]',
      LAPIS_CI_RUST_PACKAGES: '["independent"]',
    }).some(([, args]) => args.includes("scripts/prepare-bundled-skills.mjs")),
  );
});
for (const kind of ["unit", "quality"]) {
  test(`${kind} native selection prepares packaged skills before Cargo on a clean checkout`, () => {
    const cwd = mkdtempSync(join(tmpdir(), "lapis-ci-skills-"));
    try {
      mkdirSync(join(cwd, "scripts"));
      cpSync(
        "scripts/prepare-bundled-skills.mjs",
        join(cwd, "scripts/prepare-bundled-skills.mjs"),
      );
      const pkg = join(cwd, "node_modules/@lapis-notes/markdown");
      mkdirSync(pkg, { recursive: true });
      writeFileSync(
        join(pkg, "package.json"),
        JSON.stringify({
          name: "@lapis-notes/markdown",
          exports: { "./skills.json": "./skills.json" },
        }),
      );
      const skills = [
        {
          name: "lapis-markdown",
          files: { "SKILL.md": "packaged instructions" },
        },
      ];
      writeFileSync(join(pkg, "skills.json"), JSON.stringify(skills));
      const probe = join(cwd, "cargo-probe.mjs");
      writeFileSync(
        probe,
        `import assert from "node:assert/strict"; import { readFileSync } from "node:fs"; assert.deepEqual(JSON.parse(readFileSync("src-tauri/resources/bundled-skills.json", "utf8")), ${JSON.stringify(skills)});`,
      );
      const commands =
        kind === "unit"
          ? unitCommands({ LAPIS_CI_UNIT_GROUPS: '["rust"]' })
          : qualityCommands({ LAPIS_CI_QUALITY_GROUPS: '["rust"]' });
      // Run the real resource preparation and a Cargo-boundary resource probe;
      // unrelated formatter and source-audit commands belong to their own lanes.
      for (const [command, args] of commands) {
        if (command === "cargo")
          execFileSync(process.execPath, [probe], { cwd });
        else if (args.includes("scripts/prepare-bundled-skills.mjs"))
          execFileSync(command, args, { cwd });
      }
      assert.deepEqual(
        JSON.parse(
          readFileSync(
            join(cwd, "src-tauri/resources/bundled-skills.json"),
            "utf8",
          ),
        ),
        skills,
      );
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
}
test("renderer tests and release-tool checks do not start native Cargo or AI suites", () => {
  const commands = unitCommands({
    LAPIS_CI_UNIT_GROUPS: '["governance","renderer"]',
  });
  assert.equal(commands.length, 1);
  assert.equal(commands[0][0], process.execPath);
  assert.ok(commands[0][1].some((v) => v.startsWith("tests/renderer/")));
  assert.ok(
    !qualityCommands({ LAPIS_CI_QUALITY_GROUPS: "[]" }).some(
      ([command]) => command === "cargo",
    ),
  );
});
test("invalid selector input cannot inject commands or silently empty native coverage", () => {
  for (const value of ['["rust","rust"]', '["unknown"]', "null"])
    assert.throws(() => unitCommands({ LAPIS_CI_UNIT_GROUPS: value }));
  for (const value of ["[]", '["x; command"]', "{}"])
    assert.throws(() => rustArguments(value));
  assert.deepEqual(rustArguments("null"), ["--workspace"]);
});
