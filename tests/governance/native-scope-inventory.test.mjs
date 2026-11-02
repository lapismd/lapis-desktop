import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { nativeInventory } from "../../scripts/native-families.mjs";
import {
  discoverNativeFiles,
  nativeOptionalInventory,
  validateNativeCoverage,
} from "../../scripts/native-scope-inventory.mjs";

test("current native test discovery has one explicit headed or optional owner", () => {
  const discovered = discoverNativeFiles();
  const coverage = validateNativeCoverage({
    headed: nativeInventory.files,
    discovered,
  });
  assert.equal(coverage.files, discovered.length);
  assert.equal(coverage.headed + coverage.optional, coverage.files);
  assert.ok(nativeOptionalInventory.files.some(({ scope }) => scope === "api"));
  assert.ok(
    nativeOptionalInventory.files.some(
      ({ scope }) => scope === "live-provider",
    ),
  );
  assert.ok(
    nativeOptionalInventory.files.some(
      ({ scope }) => scope === "standalone-native",
    ),
  );
});

test("new unclassified test/spec files discovered on disk cannot vanish behind broad family selection", () => {
  const directory = mkdtempSync(join(tmpdir(), "lapis-native-coverage-"));
  try {
    mkdirSync(join(directory, "tests/desktop"), { recursive: true });
    for (const file of ["new-native.test.mjs", "new-window.spec.mjs"])
      writeFileSync(
        join(directory, "tests/desktop", file),
        "// new native scenario\n",
      );
    writeFileSync(
      join(directory, "tests/desktop/helper.mjs"),
      "// helper is not a test\n",
    );
    const additions = discoverNativeFiles(directory);
    assert.equal(additions.length, 2);
    for (const file of additions)
      assert.throws(
        () =>
          validateNativeCoverage({
            headed: nativeInventory.files,
            discovered: [...discoverNativeFiles(), file],
          }),
        /Unclassified native test file/,
      );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("scope completeness rejects missing files, duplicate primary owners and misleading optional lanes", () => {
  const headed = nativeInventory.files,
    discovered = discoverNativeFiles();
  const optional = () => structuredClone(nativeOptionalInventory);
  assert.throws(
    () => validateNativeCoverage({ headed, discovered: discovered.slice(1) }),
    /missing file/,
  );
  assert.throws(
    () =>
      validateNativeCoverage({
        headed,
        discovered: [...discovered, discovered[0]],
      }),
    /duplicate/,
  );
  assert.throws(
    () =>
      validateNativeCoverage({ headed: [...headed, headed[0]], discovered }),
    /duplicate/,
  );
  const duplicateScope = optional();
  duplicateScope.files.push({
    ...duplicateScope.files[0],
    file: headed[0].file,
  });
  assert.throws(
    () =>
      validateNativeCoverage({ headed, optional: duplicateScope, discovered }),
    /duplicate/,
  );
  const duplicatedOptional = optional();
  duplicatedOptional.files.push(duplicatedOptional.files[0]);
  assert.throws(
    () =>
      validateNativeCoverage({
        headed,
        optional: duplicatedOptional,
        discovered,
      }),
    /duplicate/,
  );
  const missingOptional = optional();
  missingOptional.files.pop();
  assert.throws(
    () =>
      validateNativeCoverage({ headed, optional: missingOptional, discovered }),
    /Unclassified/,
  );
  const falseLane = optional();
  falseLane.files.find(({ scope }) => scope === "standalone-native").scope =
    "api";
  assert.throws(
    () => validateNativeCoverage({ headed, optional: falseLane, discovered }),
    /absent its dispatcher/,
  );
  const unreviewedGap = optional();
  unreviewedGap.files[0].reason = "";
  assert.throws(
    () =>
      validateNativeCoverage({ headed, optional: unreviewedGap, discovered }),
    /concrete owner and reason/,
  );
  const liveFile = nativeOptionalInventory.files.find(
    ({ scope }) => scope === "live-provider",
  ).file;
  assert.throws(
    () =>
      validateNativeCoverage({
        headed: [...headed, { file: liveFile }],
        discovered,
      }),
    /Live provider/,
  );
});

test("the required planning dependency refuses to load when a checkout adds an unowned native scenario", () => {
  const directory = mkdtempSync(join(tmpdir(), "lapis-native-plan-scope-"));
  try {
    mkdirSync(join(directory, "scripts"));
    mkdirSync(join(directory, "tests/desktop"), { recursive: true });
    for (const name of [
      "native-families.mjs",
      "native-family-inventory.json",
      "native-scope-inventory.mjs",
      "native-optional-inventory.json",
      "desktop-api-tests.mjs",
      "live-provider-tests.mjs",
    ])
      cpSync(resolve("scripts", name), join(directory, "scripts", name));
    for (const file of discoverNativeFiles())
      writeFileSync(
        join(directory, file),
        "// scope fixture, never executed\n",
      );
    const invoke = () =>
      spawnSync(
        process.execPath,
        [
          "--input-type=module",
          "-e",
          `await import(${JSON.stringify(pathToFileURL(join(directory, "scripts/native-families.mjs")).href)})`,
        ],
        { encoding: "utf8" },
      );
    const before = invoke();
    assert.equal(before.status, 0, before.stderr);
    writeFileSync(
      join(directory, "tests/desktop/new-native.test.mjs"),
      "// new scenario\n",
    );
    const after = invoke();
    assert.notEqual(after.status, 0);
    assert.match(
      after.stderr,
      /Unclassified native test file: tests\/desktop\/new-native\.test\.mjs/,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
