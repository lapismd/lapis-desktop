import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { createRequire } from "node:module";
import { archiveHookSource } from "../../scripts/local-archives.mjs";

test("archive admission redirects local development tools but ignores published development-only pins", () => {
  const entry = {
    name: "@lapismd/spec-validator",
    version: "0.1.4",
    tarball: "/verified/validator.tgz",
  };
  const context = {
    module: { exports: {} },
    require: createRequire(import.meta.url),
  };
  vm.runInNewContext(archiveHookSource([entry], ["local-desktop"]), context);
  const { readPackage } = context.module.exports.hooks;
  const installed = readPackage({
    name: "local-desktop",
    devDependencies: { [entry.name]: "^0.1.4" },
  });
  assert.equal(
    installed.devDependencies[entry.name],
    "file:/verified/validator.tgz",
  );
  const published = readPackage({
    name: "@lapismd/ai-host",
    dependencies: { [entry.name]: "^0.1.0" },
    devDependencies: { [entry.name]: "0.1.0" },
  });
  assert.equal(
    published.dependencies[entry.name],
    "file:/verified/validator.tgz",
  );
  assert.equal(published.devDependencies[entry.name], "0.1.0");
  assert.throws(
    () =>
      readPackage({
        name: "@lapismd/ai-host",
        dependencies: { [entry.name]: "0.1.0" },
      }),
    /does not satisfy/u,
  );
});
