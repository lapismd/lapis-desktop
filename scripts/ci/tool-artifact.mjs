import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  artifactProvenance,
  verifyArtifactProvenance,
} from "../ci-artifact-provenance.mjs";
import {
  digest,
  inventory,
  safePath,
  verifyFiles,
} from "../ci-artifact-identity.mjs";
import {
  imageReference,
  loadImageManifest,
  validateImageManifest,
} from "./image.mjs";
import { vectorscanPin } from "../validation/install-tools.mjs";

export const toolPlatforms = ["linux-x64", "linux-arm64", "darwin-arm64"];
const executables = ["jj", "mdbook"];

function verifyBundle(root) {
  const manifest = JSON.parse(readFileSync(join(root, "manifest.json")));
  assert.equal(manifest.schemaVersion, 2);
  assert.deepEqual(
    Object.keys(manifest.platforms).sort(),
    [...toolPlatforms].sort(),
  );
  for (const platform of toolPlatforms) {
    const [os, arch] = platform.split("-");
    const vectorscan = vectorscanPin(
      os === "darwin" ? "darwin" : "linux",
      arch,
    );
    assert.deepEqual(
      Object.keys(manifest.platforms[platform].executables).sort(),
      executables,
    );
    for (const executable of executables) {
      const file = safePath(root, `${platform}/${executable}`);
      const stat = lstatSync(file);
      assert.ok(stat.isFile(), "CI tool payload must contain ordinary files");
      assert.ok(stat.mode & 0o111, "CI tool payload must remain executable");
      assert.equal(
        digest(readFileSync(file)),
        manifest.platforms[platform].executables[executable],
        `CI tool payload digest changed: ${platform}/${executable}`,
      );
    }
    assert.deepEqual(Object.keys(manifest.platforms[platform].archives), [
      vectorscan.asset,
    ]);
    const archive = safePath(root, `${platform}/${vectorscan.asset}`);
    assert.ok(lstatSync(archive).isFile(), "Vectorscan archive must be a file");
    assert.equal(
      digest(readFileSync(archive)),
      manifest.platforms[platform].archives[vectorscan.asset],
      `Vectorscan archive digest changed: ${platform}`,
    );
  }
  assert.equal(inventory(root).length, 10, "Unexpected CI tool payload file");
  return manifest;
}

function selectedPlatform(platform, arch) {
  const key = `${platform}-${arch}`;
  assert.ok(
    toolPlatforms.includes(key),
    `Unsupported CI tool platform: ${key}`,
  );
  return key;
}

export async function exportTools(
  directory,
  source = "/opt/lapis-desktop-ci/tools",
  root = process.cwd(),
  environment = process.env,
  image,
) {
  directory = resolve(directory);
  assert.ok(!existsSync(directory), "Refusing to replace a CI tool artifact");
  image ??= await loadImageManifest(root);
  validateImageManifest(image, { requireDigest: true });
  verifyBundle(source);
  const payload = join(directory, "payload");
  mkdirSync(directory, { recursive: true });
  cpSync(source, payload, {
    recursive: true,
    dereference: false,
    verbatimSymlinks: true,
  });
  const manifest = {
    schema: 1,
    provenance: artifactProvenance(root, environment),
    image: imageReference(image),
    platforms: toolPlatforms,
    files: inventory(payload),
  };
  writeFileSync(
    join(directory, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  return manifest;
}

export async function verifyTools(
  selected,
  root = process.cwd(),
  environment = process.env,
  platform = process.platform,
  arch = process.arch,
  image,
) {
  image ??= await loadImageManifest(root);
  const manifestPath = resolve(
    selected.endsWith(".json") ? selected : join(selected, "manifest.json"),
  );
  const manifest = JSON.parse(readFileSync(manifestPath));
  assert.equal(manifest.schema, 1);
  verifyArtifactProvenance(manifest.provenance, root, environment);
  assert.equal(manifest.image, imageReference(image), "CI tool image changed");
  assert.deepEqual(manifest.platforms, toolPlatforms);
  const payload = join(dirname(manifestPath), "payload");
  verifyFiles(payload, manifest.files);
  verifyBundle(payload);
  const directory = safePath(payload, selectedPlatform(platform, arch));
  const expected = {
    jj: `jj ${image.versions.jj}`,
    mdbook: `mdbook v${image.versions.mdbook}`,
  };
  for (const [name, version] of Object.entries(expected)) {
    const actual = execFileSync(join(directory, name), ["--version"], {
      encoding: "utf8",
    }).trim();
    assert.ok(actual.startsWith(version), `${name} version changed: ${actual}`);
  }
  if (environment.GITHUB_PATH)
    writeFileSync(environment.GITHUB_PATH, directory + "\n", { flag: "a" });
  if (environment.GITHUB_ENV)
    writeFileSync(
      environment.GITHUB_ENV,
      `VECTORSCAN_PREBUILT_DIR=${directory}\nVECTORSCAN_OFFLINE=1\n`,
      { flag: "a" },
    );
  return { directory, image: manifest.image };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const [command, directory, source] = process.argv.slice(2);
  assert.ok(
    directory && ["export", "verify"].includes(command),
    "Use export|verify <artifact-directory> [tool-source]",
  );
  const result =
    command === "export"
      ? await exportTools(directory, source)
      : await verifyTools(directory);
  console.log(`CI tool artifact ${command} completed:`, result);
}
