import test from "node:test";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const executable = resolve(".local/acp/native/lapis-sync-custody-probe");
function probe(root, action) {
  return JSON.parse(
    execFileSync(executable, [action], {
      encoding: "utf8",
      timeout: 10000,
      maxBuffer: 8192,
      env: { ...process.env, LAPIS_DESKTOP_SYNC_CUSTODY_ROOT: root },
    }),
  );
}

test("macOS Sync custody retains isolated bytes across native processes and cleans its OS entry", (context) => {
  const receipt = JSON.parse(readFileSync(".local/acp/resources.json", "utf8"));
  assert.match(receipt.desktopRevision, /^[a-f0-9]{40}$/u);
  const entries = receipt.artifacts.filter(
    (entry) => entry.name === "lapis-sync-custody-probe",
  );
  assert.equal(entries.length, 1);
  assert.equal(
    createHash("sha256").update(readFileSync(executable)).digest("hex"),
    entries[0].sha256,
  );
  mkdirSync(".local/native-test", { recursive: true });
  const directory = mkdtempSync(resolve(".local/native-test/sync-custody-"));
  const profile = join(directory, "profile");
  const other = join(directory, "other-profile");
  mkdirSync(profile);
  mkdirSync(other);
  // Register cleanup before the first OS write, including failed assertions.
  context.after(() =>
    assert.deepEqual(probe(profile, "cleanup"), { removed: true }),
  );
  assert.deepEqual(probe(profile, "read"), { present: false });
  const stored = probe(profile, "store");
  assert.equal(stored.stored, true);
  assert.match(
    stored.service,
    /^org\.lapismd\.desktop\.sync\.account\.v1\.[a-f0-9]{64}$/u,
  );
  assert.deepEqual(probe(profile, "read"), { present: true });
  assert.deepEqual(probe(other, "read"), { present: false });
  assert.deepEqual(
    readdirSync(profile),
    [],
    "Custody bytes must never become profile files",
  );
  assert.deepEqual(probe(profile, "cleanup"), { removed: true });
  assert.deepEqual(probe(profile, "read"), { present: false });
});
