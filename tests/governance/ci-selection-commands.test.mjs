import assert from "node:assert/strict";
import { test } from "node:test";
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
  assert.equal(commands.length, 1);
  assert.equal(commands[0][0], "cargo");
  assert.deepEqual(commands[0][1].slice(-4), [
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
});
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
