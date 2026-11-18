import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Public historical asset; never re-sign, modify, install through the registry,
// or evaluate it. The source receipt verifies its original release signature.
const archiveSha256 =
  "09f0436532ddc5a556d0563877b02856ac5d0abc309f515c9718e24415260a6a";
const archiveSize = 5_035_388;
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const unzip = (archive, ...args) =>
  execFileSync("unzip", [...args, archive], { maxBuffer: 16 * 1024 * 1024 });

/** Original bytes for a seeded existing copy, not permission for a new install. */
export function historicalAiFiles() {
  const archive = process.env.LAPIS_DESKTOP_RETIRED_AI_ARCHIVE;
  assert.ok(archive, "Select the verified historical AI archive explicitly");
  const bytes = readFileSync(archive);
  assert.equal(bytes.length, archiveSize, "Historical AI archive size changed");
  assert.equal(
    hash(bytes),
    archiveSha256,
    "Historical AI archive hash changed",
  );
  const releaseBytes = execFileSync(
    "unzip",
    ["-p", archive, "release.signed.json"],
    { maxBuffer: 1024 * 1024 },
  );
  const release = JSON.parse(releaseBytes).signed;
  assert.equal(release.pluginId, "ai");
  assert.equal(release.version, "0.1.16");
  assert.equal(release.source.package, "@lapis-notes/ai");
  assert.equal(
    release.source.commit,
    "993e53456bf5044bc73c515cf98dc2424625e6c7",
  );
  const paths = [
    "release.signed.json",
    ...release.files.map((file) => file.path),
  ];
  assert.equal(new Set(paths).size, paths.length, "Duplicate historical path");
  for (const path of paths)
    assert.ok(
      !path.startsWith("/") &&
        path.split("/").every((part) => part && part !== "." && part !== ".."),
      "Unsafe historical path",
    );
  const actual = unzip(archive, "-Z1").toString("utf8").trim().split("\n");
  assert.deepEqual([...actual].sort(), [...paths].sort());
  const directory = mkdtempSync(join(tmpdir(), "lapis-historical-ai-"));
  try {
    execFileSync("unzip", ["-qq", archive, "-d", directory]);
    const files = { "release.signed.json": releaseBytes };
    for (const file of release.files) {
      const content = readFileSync(join(directory, file.path));
      assert.equal(content.length, file.size, file.path);
      assert.equal(hash(content), file.sha256, file.path);
      files[file.path] = content;
    }
    const manifest = JSON.parse(files["manifest.json"]);
    assert.equal(manifest.id, "ai");
    assert.equal(manifest.version, "0.1.16");
    assert.equal(manifest.lapis.runtime.entries.workspace.path, "main.mjs");
    return files;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
