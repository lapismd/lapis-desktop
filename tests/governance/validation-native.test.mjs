import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  exportNativeSources,
  restoreNativeSources,
} from "../../scripts/validation/native-sources.mjs";
import { bootstrapIgnore, laneImage } from "../../scripts/validation/model.mjs";

test("native aggregate and protocol lanes select the pinned Rust toolchain", () => {
  for (const lane of [
    "check",
    "check:rust:e2e",
    "test",
    "spec:check",
    "format:check",
    "test:rust",
  ])
    assert.equal(laneImage(lane), "full");
  for (const lane of [
    "test:storybook",
    "validation:check",
    "check:storybook-parity",
  ])
    assert.equal(laneImage(lane), "ui");
});
test("native sources export only pinned committed bytes, verify transfer and reject traversal", async () => {
  const dir = await mkdtemp(join(tmpdir(), "notes-native-sources-"));
  const repository = join(dir, "source"),
    input = join(dir, "input"),
    output = join(dir, "output");
  const jj = (args) =>
    execFileSync(
      "jj",
      [
        "--config",
        'user.name="Validation"',
        "--config",
        'user.email="validation@localhost"',
        ...args,
      ],
      { cwd: repository, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    ).trim();
  try {
    await mkdir(repository);
    await mkdir(input);
    await mkdir(output);
    jj(["git", "init", "--colocate", repository]);
    await writeFile(join(repository, "data"), "pinned\n");
    jj(["commit", "-m", "Pinned native source"]);
    const revision = jj(["log", "-r", "@-", "--no-graph", "-T", "commit_id"]);
    await writeFile(join(repository, "data"), "unrelated pending work\n");
    const sources = await exportNativeSources(
      repository,
      input,
      { dependency: repository },
      [{ name: "dependency", revision }],
    );
    await restoreNativeSources(sources, input, output);
    assert.equal(
      await readFile(join(output, "dependency/data"), "utf8"),
      "pinned\n",
    );
    assert.equal(sources[0].revision, revision);
    await assert.rejects(
      restoreNativeSources(
        [{ ...sources[0], name: "../escape" }],
        input,
        output,
      ),
      /destination/,
    );
    await writeFile(join(input, sources[0].path), "corrupt");
    await assert.rejects(
      restoreNativeSources(sources, input, output),
      /checksum/,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("JavaScript refreshes preserve native caches and native pins invalidate them", async () => {
  const { cacheKeys, workerEnvironment } = await import(
    "../../scripts/validation/model.mjs"
  );
  const input = {
    image: "full-image",
    lock: "js-lock",
    nativeLock: "rust-lock",
    archives: "ui-v1",
    nativeSources: "native-v1",
  };
  const first = cacheKeys(input),
    refreshed = cacheKeys({ ...input, archives: "ui-v2", lock: "js-new" });
  assert.equal(first.native, refreshed.native);
  assert.notEqual(first.javascript, refreshed.javascript);
  assert.notEqual(
    first.native,
    cacheKeys({ ...input, nativeSources: "native-v2" }).native,
  );
  assert.notEqual(
    first.native,
    cacheKeys({ ...input, nativeLock: "new-rust-lock" }).native,
  );
  assert.notEqual(
    first.native,
    cacheKeys({ ...input, image: "new-toolchain" }).native,
  );
  assert.deepEqual(JSON.parse(workerEnvironment("full").TAURI_CONFIG), {
    bundle: { resources: [] },
  });
  assert.deepEqual(workerEnvironment("ui"), {});
});

test("worker bootstrap ignores mounted Rust outputs before Jujutsu initialization", async () => {
  const root = await mkdtemp(join(tmpdir(), "desktop-bootstrap-"));
  try {
    await mkdir(join(root, "src-tauri/target"), { recursive: true });
    await writeFile(join(root, "src-tauri/target/cached"), "compiled output");
    await writeFile(join(root, ".gitignore"), bootstrapIgnore);
    execFileSync("jj", ["git", "init", "--colocate", root], {
      cwd: root,
      stdio: "pipe",
    });
    const files = execFileSync("jj", ["file", "list"], {
      cwd: root,
      encoding: "utf8",
    });
    assert.equal(files, ".gitignore\n");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("JavaScript metadata cannot invalidate the Docker toolchain image", async () => {
  const { imageInputs } = await import("../../scripts/validation/images.mjs");
  const root = await mkdtemp(join(tmpdir(), "desktop-image-inputs-"));
  const manifest = {
    packageManager: "pnpm@10.34.5",
    scripts: { test: "before" },
    dependencies: { example: "1.0.0" },
  };
  try {
    await mkdir(join(root, "scripts/validation"), { recursive: true });
    await writeFile(
      join(root, "scripts/validation/Dockerfile"),
      "pinned recipe",
    );
    await writeFile(
      join(root, "scripts/validation/install-tools.mjs"),
      "verified tools",
    );
    await writeFile(join(root, "rust-toolchain.toml"), "pinned Rust");
    await writeFile(join(root, "package.json"), JSON.stringify(manifest));
    const before = await imageInputs(root, "amd64", "full");
    manifest.scripts.test = "after";
    manifest.dependencies.example = "2.0.0";
    await writeFile(join(root, "package.json"), JSON.stringify(manifest));
    await writeFile(join(root, "pnpm-lock.yaml"), "new JS graph");
    assert.deepEqual(await imageInputs(root, "amd64", "full"), before);
    manifest.packageManager = "pnpm@10.35.0";
    await writeFile(join(root, "package.json"), JSON.stringify(manifest));
    assert.notDeepEqual(await imageInputs(root, "amd64", "full"), before);
    assert.notDeepEqual(await imageInputs(root, "arm64", "full"), before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
