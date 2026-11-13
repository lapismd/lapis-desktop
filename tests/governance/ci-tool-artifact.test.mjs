import assert from "node:assert/strict";
import {
  chmodSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  exportTools,
  toolPlatforms,
  verifyTools,
} from "../../scripts/ci/tool-artifact.mjs";
import { digest } from "../../scripts/ci-artifact-identity.mjs";
import { vectorscanPin } from "../../scripts/validation/install-tools.mjs";

const image = {
  schemaVersion: 1,
  image: "ghcr.io/lapismd/lapis-desktop-ci",
  tag: "2026.11.1",
  digest: `sha256:${"a".repeat(64)}`,
  baseImage: `example.invalid/base@sha256:${"b".repeat(64)}`,
  rustImage: `example.invalid/rust@sha256:${"c".repeat(64)}`,
  versions: {
    node: "24.15.0",
    pnpm: "10.34.5",
    playwright: "1.61.1",
    git: "2.56.1",
    mdbook: "0.5.4",
    jj: "0.45.1",
    rust: "1.99.0",
  },
};

function source(root) {
  const platforms = {};
  for (const platform of toolPlatforms) {
    platforms[platform] = { executables: {}, archives: {} };
    mkdirSync(join(root, platform), { recursive: true });
    for (const [name, version] of [
      ["jj", "jj 0.45.1"],
      ["mdbook", "mdbook v0.5.4"],
    ]) {
      const path = join(root, platform, name);
      writeFileSync(path, `#!/bin/sh\necho '${version}'\n`);
      chmodSync(path, 0o755);
      platforms[platform].executables[name] = digest(readFileSync(path));
    }
    const [os, arch] = platform.split("-");
    const archive = vectorscanPin(os === "darwin" ? "darwin" : "linux", arch);
    const archivePath = join(root, platform, archive.asset);
    writeFileSync(archivePath, "test Vectorscan archive");
    archive.digest = digest(readFileSync(archivePath));
    platforms[platform].archives[archive.asset] = archive.digest;
  }
  writeFileSync(
    join(root, "manifest.json"),
    JSON.stringify({ schemaVersion: 2, platforms }, null, 2) + "\n",
  );
}

test("CI tool artifacts retain image, run, attempt, bytes and modes", async () => {
  const temporary = mkdtempSync(join(tmpdir(), "ci-tool-artifact-"));
  try {
    const tools = join(temporary, "source"),
      artifact = join(temporary, "artifact"),
      githubPath = join(temporary, "github-path"),
      githubEnvironment = join(temporary, "github-environment"),
      environment = {
        GITHUB_ACTIONS: "true",
        GITHUB_REPOSITORY: "lapismd/lapis-desktop",
        GITHUB_WORKFLOW_REF:
          "lapismd/lapis-desktop/.github/workflows/ci.yml@refs/pull/11/merge",
        GITHUB_SHA: "e".repeat(40),
        GITHUB_RUN_ID: "41932220425",
        GITHUB_RUN_ATTEMPT: "1",
        GITHUB_PATH: githubPath,
        GITHUB_ENV: githubEnvironment,
      };
    mkdirSync(tools);
    writeFileSync(githubPath, "");
    writeFileSync(githubEnvironment, "");
    source(tools);
    await exportTools(artifact, tools, process.cwd(), environment, image);
    const result = await verifyTools(
      artifact,
      process.cwd(),
      environment,
      "linux",
      "x64",
      image,
    );
    assert.match(result.directory, /linux-x64$/u);
    assert.equal(readFileSync(githubPath, "utf8"), result.directory + "\n");
    assert.equal(
      readFileSync(githubEnvironment, "utf8"),
      `VECTORSCAN_PREBUILT_DIR=${result.directory}\nVECTORSCAN_OFFLINE=1\n`,
    );
    await assert.rejects(
      verifyTools(
        artifact,
        process.cwd(),
        { ...environment, GITHUB_RUN_ATTEMPT: "2" },
        "linux",
        "x64",
        image,
      ),
      /producer provenance/u,
    );
    const relocated = join(temporary, "relocated");
    cpSync(artifact, relocated, { recursive: true });
    chmodSync(join(relocated, "payload/linux-x64/jj"), 0o644);
    await assert.rejects(
      verifyTools(relocated, process.cwd(), environment, "linux", "x64", image),
      /permissions or digests/u,
    );
    const changedImage = { ...image, digest: `sha256:${"d".repeat(64)}` };
    await assert.rejects(
      verifyTools(
        artifact,
        process.cwd(),
        environment,
        "linux",
        "x64",
        changedImage,
      ),
      /image changed/u,
    );
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

test("CI tool artifacts reject unsupported consumers and extra payload files", async () => {
  const temporary = mkdtempSync(join(tmpdir(), "ci-tool-artifact-invalid-"));
  try {
    const tools = join(temporary, "source"),
      artifact = join(temporary, "artifact");
    mkdirSync(tools);
    source(tools);
    writeFileSync(join(tools, "unexpected"), "extra");
    await assert.rejects(
      exportTools(artifact, tools, process.cwd(), {}, image),
      /Unexpected CI tool payload/u,
    );
    rmSync(join(tools, "unexpected"));
    await exportTools(artifact, tools, process.cwd(), {}, image);
    await assert.rejects(
      verifyTools(artifact, process.cwd(), {}, "darwin", "x64", image),
      /Unsupported CI tool platform/u,
    );
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
