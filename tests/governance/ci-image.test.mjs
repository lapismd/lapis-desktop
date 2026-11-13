import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parse } from "yaml";

import {
  imageReference,
  loadImageManifest,
  validateImageManifest,
} from "../../scripts/ci/image.mjs";
import {
  bundlePlatforms,
  toolPins,
  vectorscanPin,
} from "../../scripts/validation/install-tools.mjs";

const publishingSource = process.env.LAPIS_DESKTOP_CI_IMAGE_SOURCE === "1";
const previousDigest =
  "sha256:789e6a92ae0ff217b195112ff2766bfaf6aa9a7f8d81021ebf3fce4976597927";
const currentDigest =
  "sha256:8461639d06b7c4d82c31ead342d782195f789b88e8cde9e69424663a827f0cce";
const publishedDigest = publishingSource ? null : currentDigest;

test("Desktop CI image source pins every tool and base", async () => {
  const manifest = validateImageManifest(await loadImageManifest());
  assert.equal(manifest.digest, publishedDigest);
  const dockerfile = await readFile(".ci/desktop-ci.Dockerfile", "utf8");
  assert.ok(dockerfile.includes(manifest.baseImage));
  assert.ok(dockerfile.includes(manifest.rustImage));
  assert.doesNotMatch(dockerfile, /(?:FROM|image:)\s+[^\n]*:latest\b/u);
  for (const platform of bundlePlatforms) {
    assert.deepEqual(
      toolPins(...platform, false).map(([tool]) => tool),
      ["jj", "mdBook"],
    );
    for (const pin of toolPins(...platform, false)) {
      assert.match(pin[2], /^[a-f0-9]{64}$/u);
      assert.match(pin[3], /^\d+$/u);
    }
    const archive = vectorscanPin(...platform);
    assert.match(archive.asset, /^vectorscan-0\.1\.1-.+\.tar\.gz$/u);
    assert.match(archive.digest, /^[a-f0-9]{64}$/u);
    assert.match(archive.assetId, /^\d+$/u);
  }
});

test("published image has one immutable consumer reference", async () => {
  const manifest = await loadImageManifest();
  if (publishingSource) {
    assert.equal(manifest.digest, null);
    assert.throws(() => imageReference(manifest), /digest/u);
    return;
  }
  assert.equal(
    imageReference(manifest),
    `${manifest.image}@${publishedDigest}`,
  );
  assert.throws(() => imageReference({ ...manifest, digest: null }), /digest/u);
});

test("image publication stays manual, protected and multi-architecture", async () => {
  const workflow = await readFile(
    ".github/workflows/publish-ci-image.yml",
    "utf8",
  );
  assert.match(workflow, /workflow_dispatch:/u);
  assert.match(workflow, /PUBLISH_DESKTOP_CI_IMAGE/u);
  assert.match(workflow, /platforms: linux\/amd64,linux\/arm64/u);
  assert.match(workflow, /provenance: mode=max/u);
  assert.match(workflow, /sbom: true/u);
  assert.match(workflow, /actions\/attest-build-provenance@v4/u);
  assert.match(
    workflow.replace(/\s+/gu, " "),
    /docker build .*desktop-ci\.Dockerfile .*lapis-desktop-ci:verification/u,
  );
  assert.match(
    workflow.replace(/\s+/gu, " "),
    /docker run .*lapis-desktop-ci:verification node --test tests\/governance\/ci-image-source\.test\.mjs tests\/governance\/validation\.test\.mjs/u,
  );
  assert.doesNotMatch(
    workflow,
    /run:\s*node --test[^\n]*validation\.test\.mjs/u,
  );
  assert.doesNotMatch(workflow, /\bpush:\s*\n/u);
});

test("consumer image pulls use the workflow token", async () => {
  const manifest = await loadImageManifest();
  const reference = `${manifest.image}@${publishingSource ? previousDigest : currentDigest}`;
  for (const path of [
    ".github/workflows/ci.yml",
    ".github/workflows/publish-storybook-pages.yml",
    ".github/workflows/release-desktop.yml",
    ".github/workflows/trial-desktop.yml",
  ]) {
    const workflow = parse(await readFile(path, "utf8"));
    assert.equal(
      workflow.permissions?.packages,
      "read",
      `${path} grants only package read access`,
    );
    const imageJobs =
      path === ".github/workflows/ci.yml"
        ? ["ci-tools", "quality", "unit"]
        : ["ci-tools"];
    for (const name of imageJobs) {
      const container = workflow.jobs[name]?.container;
      assert.equal(
        container?.image,
        reference,
        `${path}:${name} pins the immutable image`,
      );
      assert.deepEqual(
        container?.credentials,
        {
          username: "${{ github.actor }}",
          password: "${{ secrets.GITHUB_TOKEN }}",
        },
        `${path}:${name} authenticates its immutable image pull`,
      );
    }
  }
});

test("published image feeds verified current-attempt tools to every consumer", async () => {
  const manifest = await loadImageManifest();
  const reference = publishingSource
    ? `${manifest.image}@${previousDigest}`
    : imageReference(manifest);
  const workflows = [
    ".github/workflows/ci.yml",
    ".github/workflows/publish-storybook-pages.yml",
    ".github/workflows/release-desktop.yml",
    ".github/workflows/trial-desktop.yml",
  ];
  const consumers = [];
  for (const path of workflows) {
    const source = await readFile(path, "utf8"),
      workflow = parse(source),
      producer = workflow.jobs["ci-tools"];
    assert.equal(producer.container.image, reference, `${path} pins the image`);
    const exportStep = producer.steps.find(
      (step) => step.name === "Export image-owned cross-platform tools",
    );
    assert.match(
      exportStep?.run ?? "",
      /git config --global --add safe\.directory "\$GITHUB_WORKSPACE"/u,
      `${path} trusts its container-mounted checkout before reading provenance`,
    );
    assert.doesNotMatch(source, /install-tools\.mjs --ci/u);
    assert.doesNotMatch(source, /taiki-e\/install-action/u);
    for (const [name, job] of Object.entries(workflow.jobs)) {
      if (
        !(job.steps ?? []).some(
          (step) => step.uses === "./.github/actions/setup-ci-tools",
        )
      )
        continue;
      consumers.push(`${path}:${name}`);
      assert.ok(
        (Array.isArray(job.needs) ? job.needs : [job.needs]).includes(
          "ci-tools",
        ),
        `${path} ${name} requires its producer`,
      );
    }
  }
  assert.deepEqual(consumers, [
    ".github/workflows/ci.yml:governance",
    ".github/workflows/ci.yml:quality",
    ".github/workflows/ci.yml:unit",
    ".github/workflows/ci.yml:storybook-static",
    ".github/workflows/ci.yml:storybook-interaction-shards",
    ".github/workflows/ci.yml:bundle",
    ".github/workflows/ci.yml:linux",
    ".github/workflows/ci.yml:audit",
    ".github/workflows/ci.yml:dependency-packages",
    ".github/workflows/publish-storybook-pages.yml:build",
    ".github/workflows/release-desktop.yml:build",
    ".github/workflows/trial-desktop.yml:build",
  ]);
  const action = await readFile(
    ".github/actions/setup-ci-tools/action.yml",
    "utf8",
  );
  assert.match(action, /ci-tools-\$\{\{ github\.run_attempt \}\}/u);
  const trustWorkspace =
      'git config --global --add safe.directory "$GITHUB_WORKSPACE"',
    trustIndex = action.indexOf(trustWorkspace),
    verifyIndex = action.indexOf("scripts/ci/tool-artifact.mjs verify");
  assert.ok(trustIndex >= 0, "consumer trusts its exact mounted workspace");
  assert.ok(
    trustIndex < verifyIndex,
    "consumer trusts the workspace before reading artifact provenance",
  );
  assert.doesNotMatch(action, /safe\.directory ["']?\*["']?/u);
  assert.match(action, /scripts\/ci\/tool-artifact\.mjs verify/u);
});
