import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

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

test("Desktop CI image source pins every tool, archive and base", async () => {
  const manifest = validateImageManifest(await loadImageManifest());
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

test("image source is unpublished only during its protected handoff", async () => {
  const manifest = await loadImageManifest();
  if (publishingSource) {
    assert.equal(manifest.digest, null);
    assert.throws(() => imageReference(manifest), /digest/u);
  } else {
    assert.match(manifest.digest, /^sha256:[a-f0-9]{64}$/u);
    assert.equal(
      imageReference(manifest),
      `${manifest.image}@${manifest.digest}`,
    );
  }
});

test("image publication stays manual, protected and multi-architecture", async () => {
  const workflow = await readFile(
    ".github/workflows/publish-ci-image.yml",
    "utf8",
  );
  assert.match(workflow, /workflow_dispatch:/u);
  assert.match(workflow, /PUBLISH_DESKTOP_CI_IMAGE/u);
  assert.match(workflow, /LAPIS_DESKTOP_CI_IMAGE_SOURCE: "1"/u);
  assert.match(workflow, /ci-image-source\.test\.mjs/u);
  assert.doesNotMatch(workflow, /pnpm (?:install|add|dlx)/u);
  assert.match(workflow, /platforms: linux\/amd64,linux\/arm64/u);
  assert.match(workflow, /provenance: mode=max/u);
  assert.match(workflow, /sbom: true/u);
  assert.match(workflow, /actions\/attest-build-provenance@v4/u);
});
