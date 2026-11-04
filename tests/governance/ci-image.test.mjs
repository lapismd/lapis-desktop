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
} from "../../scripts/validation/install-tools.mjs";

test("Desktop CI image source pins every tool and base", async () => {
  const manifest = validateImageManifest(await loadImageManifest());
  assert.equal(manifest.digest, null);
  const dockerfile = await readFile(".ci/desktop-ci.Dockerfile", "utf8");
  assert.ok(dockerfile.includes(manifest.baseImage));
  assert.ok(dockerfile.includes(manifest.rustImage));
  assert.doesNotMatch(dockerfile, /(?:FROM|image:)\s+[^\n]*:latest\b/u);
  for (const platform of bundlePlatforms)
    assert.deepEqual(
      toolPins(...platform, false).map(([tool]) => tool),
      ["jj", "mdBook"],
    );
});

test("unpublished image cannot become a consumer reference", async () => {
  const manifest = await loadImageManifest();
  assert.throws(() => imageReference(manifest), /digest/u);
  assert.equal(
    imageReference({ ...manifest, digest: `sha256:${"a".repeat(64)}` }),
    `${manifest.image}@sha256:${"a".repeat(64)}`,
  );
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
    /docker run .*lapis-desktop-ci:verification node --test tests\/governance\/ci-image\.test\.mjs tests\/governance\/validation\.test\.mjs/u,
  );
  assert.doesNotMatch(
    workflow,
    /run:\s*node --test[^\n]*validation\.test\.mjs/u,
  );
  assert.doesNotMatch(workflow, /\bpush:\s*\n/u);
});

test("published image feeds verified current-attempt tools to every consumer", async () => {
  const reference = imageReference(await loadImageManifest());
  const workflows = [
    ".github/workflows/ci.yml",
    ".github/workflows/native-quarantine.yml",
    ".github/workflows/publish-storybook-pages.yml",
    ".github/workflows/release-desktop.yml",
  ];
  let consumers = 0;
  for (const path of workflows) {
    const source = await readFile(path, "utf8"),
      workflow = parse(source),
      producer = workflow.jobs["ci-tools"];
    assert.equal(producer.container.image, reference, `${path} pins the image`);
    assert.doesNotMatch(source, /install-tools\.mjs --ci/u);
    assert.doesNotMatch(source, /taiki-e\/install-action/u);
    for (const [name, job] of Object.entries(workflow.jobs)) {
      if (
        !(job.steps ?? []).some(
          (step) => step.uses === "./.github/actions/setup-ci-tools",
        )
      )
        continue;
      consumers++;
      assert.ok(
        (Array.isArray(job.needs) ? job.needs : [job.needs]).includes(
          "ci-tools",
        ),
        `${path} ${name} requires its producer`,
      );
    }
  }
  assert.equal(consumers, 14);
  const action = await readFile(
    ".github/actions/setup-ci-tools/action.yml",
    "utf8",
  );
  assert.match(action, /ci-tools-\$\{\{ github\.run_attempt \}\}/u);
  assert.match(action, /scripts\/ci\/tool-artifact\.mjs verify/u);
});
