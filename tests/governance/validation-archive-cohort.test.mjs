import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import vm from "node:vm";
import { assertArchiveSnapshots } from "../../scripts/archive-resolution.mjs";
import {
  archiveHookSource,
  validateArchiveRanges,
} from "../../scripts/archive-hook.mjs";

const entry = {
  name: "@lapis-notes/api",
  version: "0.6.5",
  tarball: "/verified/api.tgz",
};

test("installed graph refuses mixed registry bytes and duplicate peer contexts", () => {
  const file = `${entry.name}@file:.local/api.tgz(peer-a)`;
  const registry = `${entry.name}@${entry.version}(peer-a)`;
  assertArchiveSnapshots({ snapshots: { [file]: {}, "yaml@2.9.0": {} } }, [
    entry,
  ]);
  assert.throws(
    () =>
      assertArchiveSnapshots({ snapshots: { [file]: {}, [registry]: {} } }, [
        entry,
      ]),
    /one installed context/,
  );
  assert.throws(
    () =>
      assertArchiveSnapshots(
        {
          snapshots: {
            [file]: {},
            [`${entry.name}@file:.local/api.tgz(peer-b)`]: {},
          },
        },
        [entry],
      ),
    /one installed context/,
  );
  assert.throws(
    () => assertArchiveSnapshots({ snapshots: { [registry]: {} } }, [entry]),
    /registry package/,
  );
  assert.throws(
    () => assertArchiveSnapshots({}, [entry]),
    /one installed context/,
  );
});

test("admitted archive graph routes dependency, optional and peer API consumers to the same bytes", () => {
  const context = {
    module: { exports: {} },
    require: createRequire(import.meta.url),
  };
  vm.runInNewContext(archiveHookSource([entry], ["desktop"]), context);
  const { readPackage } = context.module.exports.hooks;
  for (const field of [
    "dependencies",
    "optionalDependencies",
    "peerDependencies",
  ]) {
    const pkg = readPackage({
      name: "profile",
      [field]: { [entry.name]: "^0.6.1" },
    });
    assert.equal(
      pkg[field === "peerDependencies" ? "dependencies" : field][entry.name],
      "file:/verified/api.tgz",
    );
    if (field === "peerDependencies")
      assert.equal(pkg.peerDependencies[entry.name], "^0.6.1");
  }
  const local = readPackage({
    name: "desktop",
    devDependencies: { [entry.name]: "^0.6.5" },
  });
  assert.equal(local.devDependencies[entry.name], "file:/verified/api.tgz");
  const published = readPackage({
    name: "profile",
    devDependencies: { [entry.name]: "^0.2.0" },
  });
  assert.equal(published.devDependencies[entry.name], "^0.2.0");
  assert.throws(
    () =>
      readPackage({
        name: "profile",
        dependencies: { [entry.name]: "^0.4.0" },
      }),
    /does not satisfy/,
  );
});

test("range admission checks every original root section before projection", () => {
  for (const field of [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
  ]) {
    const manifest = { [field]: { [entry.name]: "^0.6.1" } };
    const before = structuredClone(manifest);
    validateArchiveRanges(manifest, [entry]);
    assert.deepEqual(manifest, before);
    assert.throws(
      () =>
        validateArchiveRanges({ [field]: { [entry.name]: "^0.4.0" } }, [entry]),
      /declared root range/,
    );
    assert.throws(
      () =>
        validateArchiveRanges(
          { [field]: { [entry.name]: "file:/unverified/api.tgz" } },
          [entry],
        ),
      /declared root range/,
    );
  }
  assert.throws(() => validateArchiveRanges({}, [entry]), /not declared/);
});

test("only the admitted root can retain its exact relative projected archive selection", () => {
  const context = {
    module: { exports: {} },
    require: createRequire(import.meta.url),
  };
  const declared = "file:.local/archives/api.tgz";
  vm.runInNewContext(
    archiveHookSource([{ ...entry, declared }], ["desktop"]),
    context,
  );
  const { readPackage } = context.module.exports.hooks;
  assert.equal(
    readPackage({ name: "desktop", dependencies: { [entry.name]: declared } })
      .dependencies[entry.name],
    "file:/verified/api.tgz",
  );
  assert.throws(
    () =>
      readPackage({ name: "other", dependencies: { [entry.name]: declared } }),
    /does not satisfy/,
  );
  assert.throws(
    () =>
      readPackage({
        name: "desktop",
        dependencies: { [entry.name]: "file:.local/archives/other.tgz" },
      }),
    /does not satisfy/,
  );
});
