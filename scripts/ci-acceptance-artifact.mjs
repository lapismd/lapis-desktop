import assert from "node:assert/strict";
import {
  artifactProvenance,
  verifyArtifactProvenance,
} from "./ci-artifact-provenance.mjs";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { acceptanceBinary } from "./native-acceptance-binary.mjs";
import {
  buildIdentity,
  digest,
  inventory,
  safePath,
  verifyFiles,
  verifyIdentity,
} from "./ci-artifact-identity.mjs";

export const acceptanceApp =
  "src-tauri/target/debug/bundle/macos/Lapis Notes Acceptance.app";
const immutablePaths = [
  acceptanceApp,
  ".local/acp/native",
  "src-tauri/resources/lapis-ai",
  ".local/native-tasks/artifact",
  ".local/native-tasks/provenance.json",
  ".local/native-test/ui",
];
function portableFixtures(root, payload) {
  const selected =
    process.env.LAPIS_DESKTOP_PORTABLE_FIXTURES ??
    join(root, ".local/ci-native-plugins/manifest.json");
  const manifest = JSON.parse(readFileSync(selected));
  assert.ok(
    manifest.entries?.length,
    "Missing immutable portable plugin fixtures",
  );
  const entries = manifest.entries.map((entry) => {
    assert.match(entry.pluginId, /^[a-z][a-z0-9-]+$/);
    const base = `.local/ci-native-plugins/resources/${entry.pluginId}`;
    const archive = `${base}/bundle.lapis-plugin`,
      filesDirectory = `${base}/files`;
    assert.equal(digest(readFileSync(entry.archive)), entry.sha256);
    mkdirSync(safePath(payload, base), { recursive: true });
    cpSync(entry.archive, safePath(payload, archive));
    cpSync(entry.filesDirectory, safePath(payload, filesDirectory), {
      recursive: true,
    });
    return { ...entry, archive, filesDirectory };
  });
  const path = ".local/ci-native-plugins/manifest.json";
  writeFileSync(
    safePath(payload, path),
    JSON.stringify({ ...manifest, entries }, null, 2) + "\n",
  );
  return path;
}
export function exportAcceptance(directory, root = process.cwd()) {
  directory = resolve(directory);
  acceptanceBinary(join(root, acceptanceApp, "Contents/MacOS/lapis-desktop"));
  assert.ok(
    !existsSync(directory),
    "Refusing to replace an existing acceptance artifact",
  );
  const payload = join(directory, "payload");
  mkdirSync(payload, { recursive: true });
  for (const path of immutablePaths) {
    const target = safePath(payload, path);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(safePath(root, path), target, {
      recursive: true,
      dereference: false,
      verbatimSymlinks: true,
    });
  }
  const portable = portableFixtures(root, payload);
  const manifest = {
    schema: 1,
    provenance: artifactProvenance(root),
    identity: buildIdentity(root, "acceptance"),
    paths: immutablePaths,
    portable,
    files: inventory(payload),
  };
  const manifestPath = join(directory, "manifest.json");
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  return manifestPath;
}
/** Restore only verified immutable inputs. Profiles, vaults and private keys are never transferred. */
export function verifyAcceptance(selected, root = process.cwd()) {
  const manifestPath = resolve(
    selected.endsWith(".json") ? selected : join(selected, "manifest.json"),
  );
  const manifest = JSON.parse(readFileSync(manifestPath));
  assert.equal(manifest.schema, 1);
  verifyArtifactProvenance(manifest.provenance, root);
  verifyIdentity(manifest.identity, buildIdentity(root, "acceptance"));
  assert.deepEqual(
    manifest.paths,
    immutablePaths,
    "Unexpected acceptance resource destinations",
  );
  assert.equal(manifest.portable, ".local/ci-native-plugins/manifest.json");
  const payload = join(dirname(manifestPath), "payload");
  verifyFiles(payload, manifest.files);
  acceptanceBinary(
    join(payload, acceptanceApp, "Contents/MacOS/lapis-desktop"),
  );
  // Copying into an existing application bundle can retain stale files. Require fresh destinations.
  for (const path of [...immutablePaths, ".local/ci-native-plugins"])
    assert.ok(
      !existsSync(safePath(root, path)),
      `Acceptance restore destination already exists: ${path}`,
    );
  for (const path of [...immutablePaths, ".local/ci-native-plugins"]) {
    const target = safePath(root, path);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(safePath(payload, path), target, {
      recursive: true,
      dereference: false,
      verbatimSymlinks: true,
    });
  }
  const portable = safePath(root, manifest.portable);
  const fixtures = JSON.parse(readFileSync(portable));
  fixtures.entries = fixtures.entries.map((entry) => ({
    ...entry,
    archive: safePath(root, entry.archive),
    filesDirectory: safePath(root, entry.filesDirectory),
  }));
  writeFileSync(portable, JSON.stringify(fixtures, null, 2) + "\n");
  return {
    acceptanceBinary: join(root, acceptanceApp, "Contents/MacOS/lapis-desktop"),
    portableFixtures: portable,
    identity: manifest.identity,
    manifestPath,
  };
}
export const verifyAcceptanceArtifact = verifyAcceptance;
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const [command, directory] = process.argv.slice(2);
  assert.ok(
    directory && ["export", "verify"].includes(command),
    "Use export|verify <artifact-directory>",
  );
  console.log(
    command === "export"
      ? exportAcceptance(directory)
      : verifyAcceptance(directory),
  );
}
