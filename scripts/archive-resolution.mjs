import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import assert from "node:assert/strict";

/** A same-version registry copy or second peer context cannot share App identity. */
export function assertArchiveSnapshots(lock, entries) {
  const snapshots = Object.keys(lock.snapshots ?? {});
  for (const { name } of entries) {
    const selected = snapshots.filter((key) => key.startsWith(`${name}@`));
    assert.equal(
      selected.length,
      1,
      `Archive must have one installed context: ${name}`,
    );
    assert.ok(
      selected[0].startsWith(`${name}@file:`),
      `Archive graph selected a registry package: ${name}`,
    );
  }
}

/** Verify the installed graph and bytes at every pnpm dependency context. */
export function verifyArchiveGraph(root, entries) {
  const { parse } = createRequire(join(resolve(root), "package.json"))("yaml");
  const store = join(root, "node_modules/.pnpm");
  assertArchiveSnapshots(
    parse(readFileSync(join(store, "lock.yaml"), "utf8")),
    entries,
  );
  const scopes = readdirSync(store, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "node_modules")
    .map((entry) => join(store, entry.name));
  return verifyArchiveResolution(root, entries, scopes);
}

function fingerprint(root, includeDependencies) {
  const hash = createHash("sha256");
  function visit(directory, relative = "") {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort(
      (a, b) => a.name.localeCompare(b.name),
    )) {
      // pnpm adds dependency bin shims that are absent from ordinary tarballs.
      if (!relative && entry.name === "node_modules" && !includeDependencies)
        continue;
      const path = join(directory, entry.name);
      const name = `${relative}/${entry.name}`;
      if (entry.isDirectory()) visit(path, name);
      else {
        hash.update(
          JSON.stringify([name, entry.isSymbolicLink() ? "link" : "file"]),
        );
        hash.update(
          entry.isSymbolicLink() ? readlinkSync(path) : readFileSync(path),
        );
      }
    }
  }
  visit(root);
  return hash.digest("hex");
}

/** Compare installed bytes with the verified tarball across active import routes. */
export function verifyArchiveResolution(root, entries, scopes = [root]) {
  const temporary = mkdtempSync(join(tmpdir(), "lapis-archive-resolution-"));
  const digests = new Map();
  let checked = 0;
  try {
    for (const entry of entries) {
      const unpacked = join(temporary, entry.name.replaceAll("/", "-"));
      mkdirSync(unpacked, { recursive: true });
      execFileSync("tar", ["-xzf", entry.tarball, "-C", unpacked]);
      const payload = join(unpacked, "package");
      const includeDependencies = existsSync(join(payload, "node_modules"));
      const expected = fingerprint(payload, includeDependencies);
      for (const scope of new Set([
        resolve(root),
        ...scopes.map((path) => resolve(path)),
      ])) {
        const imported = join(scope, "node_modules", entry.name);
        if (scope !== resolve(root) && !existsSync(imported)) continue;
        const physical = realpathSync(imported);
        assert.match(
          physical,
          /[/\\]\.pnpm[/\\].*@file\+/u,
          `Archive not installed: ${scope} -> ${entry.name}`,
        );
        if (!digests.has(physical))
          digests.set(physical, fingerprint(physical, includeDependencies));
        assert.equal(
          digests.get(physical),
          expected,
          `Workspace archive identity differs: ${scope} -> ${entry.name}`,
        );
        checked++;
      }
    }
    return checked;
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}
