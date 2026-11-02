import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, basename } from "node:path";
import {
  createArtifact,
  createManifest,
  releaseTargets,
} from "../../scripts/release/contract.mjs";
import {
  sealCandidate,
  verifyCandidate,
} from "../../scripts/release/candidate.mjs";
import { fullCIJobs } from "../../scripts/release/source-ci.mjs";
import { publishCandidate } from "../../scripts/release/publish.mjs";
const source = "a".repeat(40),
  version = "2026.31.6-rc.1",
  tag = `desktop-v${version}`;
const ci = {
  id: 9,
  event: "push",
  head_sha: source,
  head_branch: "main",
  status: "completed",
  conclusion: "success",
};
async function candidate(context) {
  const directory = await mkdtemp(join(tmpdir(), "desktop-release-test-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const identity = { version, tag, sourceCommit: source };
  const bytes = Buffer.from("qualified archive");
  const manifest = createManifest(
    identity,
    releaseTargets.map(({ target }) => createArtifact(identity, bytes, target)),
  );
  const json = (file, value) =>
    writeFile(join(directory, file), JSON.stringify(value) + "\n");
  const sourceCI = {
    sourceCommit: source,
    ciResult: "success",
    fullQualification: true,
    ciRun: 9,
    ciUrl: "https://github.com/lapismd/lapis-desktop/actions/runs/9",
  };
  const platforms = [];
  for (const artifact of manifest.artifacts) {
    const binding = {
      ...identity,
      target: artifact.target,
      artifactSha256: artifact.sha256,
    };
    await writeFile(join(directory, artifact.file), bytes);
    platforms.push({
      ...binding,
      helperProfile: "release",
      sourceCI,
      sources: [{ repository: "lapismd/lapis-ai", revision: "b".repeat(40) }],
      privateArchives: [
        {
          name: "@lapismd/ai",
          version: "0.2.0",
          sourceRepository: "lapismd/lapis-ai",
          sourceCommit: "b".repeat(40),
          sha256: "c".repeat(64),
          size: 7,
        },
      ],
    });
    await json(`bundle-check-${artifact.target}.json`, {
      target: artifact.target,
      artifactSha256: artifact.sha256,
      result: "pass",
      normalAutomationMarkers: 0,
      architectures: artifact.architecture,
    });
    await json(`homebrew-${artifact.target}-homebrew.json`, {
      ...binding,
      ok: true,
      install: "passed",
      reinstall: "passed",
      uninstall: "passed",
      retainedProfileAndVault: "passed",
      audit: "passed",
      upgrade: "not-run: no previous different preview",
    });
    for (const phase of ["install", "reinstall"])
      await json(`homebrew-${artifact.target}-${phase}.json`, {
        ...binding,
        ok: true,
        architecture: artifact.architecture,
        signature:
          artifact.platform === "macos" ? "verified" : "not-applicable",
        visibleNativeWindow: true,
        gracefulQuit: true,
        nodeDenoOnPath: false,
        ordinaryBundle: "verified",
      });
  }
  await json("desktop-manifest.json", manifest);
  await json("build-metadata.json", {
    schemaVersion: 2,
    ...identity,
    sourceCI,
    platforms,
  });
  await writeFile(
    join(directory, "LIMITATIONS.md"),
    "Existing native cases remain unqualified.\n",
  );
  await sealCandidate(directory);
  return { directory, manifest };
}
function service({
  interrupt = false,
  wrongTag = false,
  failedCI = false,
} = {}) {
  const state = {
    tag: wrongTag ? { object: { type: "commit", sha: "b".repeat(40) } } : null,
    release: null,
    bytes: new Map(),
    uploads: 0,
    publicizations: 0,
  };
  state.request = async (path, options = {}) => {
    if (path.includes("/actions/runs/9/jobs"))
      return {
        jobs: fullCIJobs.map((name, id) => ({
          id: id + 1,
          name,
          status: "completed",
          conclusion: "success",
          run_attempt: ci.run_attempt,
        })),
      };
    if (path.includes("ci.yml/runs"))
      return {
        workflow_runs: [
          { ...ci, conclusion: failedCI ? "failure" : "success" },
        ],
      };
    if (path.includes("/git/ref/tags/")) return state.tag;
    if (path.endsWith("/git/refs")) {
      state.tag = { object: { type: "commit", sha: options.body.sha } };
      return state.tag;
    }
    if (path.includes("/releases/tags/")) return state.release;
    if (path.endsWith("/releases") && options.method === "POST") {
      state.release = {
        ...options.body,
        id: 1,
        assets: [],
        html_url:
          "https://github.com/lapismd/lapis-desktop/releases/tag/" + tag,
      };
      return state.release;
    }
    if (path.endsWith("/releases/1")) {
      if (options.method === "PATCH") {
        state.publicizations++;
        Object.assign(state.release, options.body);
      }
      return state.release;
    }
    throw Error(`Unexpected API request ${path}`);
  };
  state.upload = async (_, file, name) => {
    if (interrupt && state.uploads === 1) {
      interrupt = false;
      throw Error("Interrupted upload");
    }
    assert.equal(basename(file), name);
    assert.ok(
      !state.bytes.has(name),
      "Uploads never overwrite an existing asset",
    );
    const bytes = await readFile(file);
    state.bytes.set(name, bytes);
    state.uploads++;
    state.release.assets.push({ id: state.uploads, name, size: bytes.length });
  };
  state.assetBytes = async (asset) => state.bytes.get(asset.name);
  return state;
}
test("candidate verification rejects changed bytes, missing inventory and forged native receipts", async (context) => {
  const { directory, manifest } = await candidate(context);
  await verifyCandidate(directory, source);
  await assert.rejects(verifyCandidate(directory, "b".repeat(40)), /source/);
  await writeFile(join(directory, manifest.artifacts[0].file), "changed");
  await assert.rejects(verifyCandidate(directory, source), /asset changed/);
  await writeFile(
    join(directory, manifest.artifacts[0].file),
    "qualified archive",
  );
  await writeFile(
    join(directory, `homebrew-${manifest.artifacts[0].target}-homebrew.json`),
    JSON.stringify({ ok: false }),
  );
  await sealCandidate(directory);
  await assert.rejects(
    verifyCandidate(directory, source),
    /Homebrew qualification/,
  );
});
test("final candidates include both qualified Linux architectures", async (context) => {
  const { directory, manifest } = await candidate(context);
  manifest.artifacts = manifest.artifacts.filter(
    (item) => item.platform === "macos",
  );
  await writeFile(
    join(directory, "desktop-manifest.json"),
    JSON.stringify(manifest),
  );
  await sealCandidate(directory);
  await assert.rejects(verifyCandidate(directory, source), /all three|Linux/);
});
test("qualification receipts cannot be reused for another target or changed Linux archive", async (context) => {
  for (const mutation of [
    (receipt) => {
      receipt.target = "aarch64-apple-darwin";
    },
    (receipt) => {
      receipt.artifactSha256 = "f".repeat(64);
    },
    (receipt) => {
      receipt.nodeDenoOnPath = true;
    },
    (receipt) => {
      receipt.architecture = "arm64";
    },
  ]) {
    const { directory } = await candidate(context);
    const file = join(
      directory,
      "homebrew-x86_64-unknown-linux-gnu-install.json",
    );
    const receipt = JSON.parse(await readFile(file, "utf8"));
    mutation(receipt);
    await writeFile(file, JSON.stringify(receipt));
    await sealCandidate(directory);
    await assert.rejects(verifyCandidate(directory, source), /smoke evidence/);
  }
});
test("publication promotes qualified bytes and an identical completed rerun is a no-op", async (context) => {
  const { directory } = await candidate(context),
    server = service();
  await publishCandidate(directory, source, server);
  const count = server.uploads;
  assert.equal(server.publicizations, 1);
  assert.equal(server.release.draft, false);
  assert.equal(server.release.prerelease, true);
  assert.equal(server.release.make_latest, "false");
  await publishCandidate(directory, source, server);
  assert.equal(server.uploads, count);
  assert.equal(server.publicizations, 1);
});
test("interrupted draft upload resumes identical assets without clobbering", async (context) => {
  const { directory } = await candidate(context),
    server = service({ interrupt: true });
  await assert.rejects(
    publishCandidate(directory, source, server),
    /Interrupted/,
  );
  assert.equal(server.release.draft, true);
  await publishCandidate(directory, source, server);
  assert.equal(server.publicizations, 1);
});
test("changed tags, failed source CI and altered existing assets never publish", async (context) => {
  const { directory } = await candidate(context);
  for (const options of [{ wrongTag: true }, { failedCI: true }]) {
    const server = service(options);
    await assert.rejects(publishCandidate(directory, source, server));
    assert.equal(server.publicizations, 0);
  }
  const server = service({ interrupt: true });
  await assert.rejects(publishCandidate(directory, source, server));
  const first = server.bytes.keys().next().value;
  server.bytes.set(first, Buffer.from("different"));
  await assert.rejects(
    publishCandidate(directory, source, server),
    /bytes differ/,
  );
  assert.equal(server.publicizations, 0);
});
