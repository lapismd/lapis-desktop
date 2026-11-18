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
import {
  bootstrapIgnore,
  laneImage,
  projectArchives,
} from "../../scripts/validation/model.mjs";

test("portable sources retain the native Notes pin and explicit Sync archive cohort", async () => {
  const native = JSON.parse(
    await readFile("scripts/validation/native-sources.json", "utf8"),
  );
  const hosted = JSON.parse(await readFile("scripts/ci-sources.json", "utf8"));
  const revision = (sources, name) =>
    sources.find((source) => source.name === name)?.revision;
  assert.equal(
    revision(native, "lapis-notes"),
    "40b9ba8ee569a737a0ace77870a094972ee6f768",
  );
  assert.equal(
    revision(hosted, "lapis-notes"),
    "6b2b39f583a30be4e6dfa734050c20af862384ba",
  );
  const manifest = JSON.parse(await readFile("package.json", "utf8"));
  assert.match(
    manifest.dependencies["@lapis-notes/app-profile"],
    /^\^\d+\.\d+\.\d+$/u,
  );
  const server = revision(hosted, "lapis-server");
  assert.match(server, /^[a-f0-9]{40}$/u);
  assert.ok(
    (await readFile("src-tauri/Cargo.toml", "utf8")).includes(
      `rev = "${server}"`,
    ),
  );
  for (const name of ["lapis-ai", "jj-store"]) {
    assert.match(revision(native, name), /^[a-f0-9]{40}$/u);
    assert.equal(revision(native, name), revision(hosted, name));
  }
  // JavaScript fixture retirement must not silently refresh qualified Rust engines.
  const pluginsNative = "879581d1549187bdbac2d75b40d02e0df46e721a";
  assert.equal(revision(native, "lapis-plugins"), pluginsNative);
  assert.equal(
    revision(hosted, "lapis-plugins"),
    "969356250f26c5561fac22cf00d8da8f395dbdae",
  );
  assert.ok(
    (await readFile("src-tauri/Cargo.lock", "utf8")).includes(
      `git+https://github.com/lapismd/lapis-plugins?rev=${pluginsNative}#${pluginsNative}`,
    ),
  );
});

test("portable archives replace their declared root ranges without duplicate contexts", () => {
  const manifest = {
    dependencies: { "@lapismd/ai": "^0.2.0" },
    devDependencies: { tool: "1.0.0" },
    pnpm: { overrides: { existing: "2.0.0" } },
  };
  const projected = projectArchives(manifest, {
    "@lapismd/ai": "file:/input/ai.tgz",
  });
  assert.equal(projected.dependencies["@lapismd/ai"], "file:/input/ai.tgz");
  assert.equal(projected.devDependencies["@lapismd/ai"], undefined);
  assert.deepEqual(projected.pnpm.overrides, { existing: "2.0.0" });
  assert.deepEqual(manifest.dependencies, { "@lapismd/ai": "^0.2.0" });
  assert.throws(
    () => projectArchives(manifest, { missing: "file:/input/missing.tgz" }),
    /not declared/,
  );
});

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
test("native sources export only pinned committed bytes, verify transfer and reject traversal", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "notes-native-sources-"));
  const repository = join(dir, "source"),
    consumer = join(dir, "consumer"),
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
        "--config",
        'signing.behavior="drop"',
        ...args,
      ],
      { cwd: repository, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    ).trim();
  try {
    await mkdir(repository);
    await mkdir(consumer);
    execFileSync("jj", ["git", "init", "--colocate", consumer], {
      cwd: consumer,
      stdio: "pipe",
    });
    await mkdir(input);
    await mkdir(output);
    jj(["git", "init", "--colocate", repository]);
    await writeFile(join(repository, "data"), "pinned\n");
    jj(["commit", "-m", "Pinned native source"]);
    const revision = jj(["log", "-r", "@-", "--no-graph", "-T", "commit_id"]);
    await writeFile(join(repository, "data"), "unrelated pending work\n");
    const operation = () =>
      jj([
        "--ignore-working-copy",
        "op",
        "log",
        "--limit",
        "1",
        "--no-graph",
        "-T",
        "id",
      ]);
    const beforeOperation = operation();
    const beforeBytes = await readFile(join(repository, "data"), "utf8");
    const sources = await exportNativeSources(
      consumer,
      input,
      { dependency: repository },
      [{ name: "dependency", revision }],
    );
    const afterOperation = operation();
    t.diagnostic(
      `sibling operation before=${beforeOperation} after=${afterOperation}`,
    );
    assert.equal(
      afterOperation,
      beforeOperation,
      "pinned export must not snapshot sibling work",
    );
    assert.equal(await readFile(join(repository, "data"), "utf8"), beforeBytes);
    await restoreNativeSources(sources, input, output);
    assert.equal(
      await readFile(join(output, "dependency/data"), "utf8"),
      "pinned\n",
    );
    assert.equal(sources[0].revision, revision);
    const { snapshot, snapshotFile } = await import(
      "../../scripts/validation/source.mjs"
    );
    const previousBase = process.env.LAPIS_DESKTOP_BASE;
    try {
      delete process.env.LAPIS_DESKTOP_BASE;
      await writeFile(
        join(consumer, "data"),
        "intentional Desktop pending work\n",
      );
      const consumerOperation = () =>
        execFileSync(
          "jj",
          [
            "--ignore-working-copy",
            "op",
            "log",
            "--limit",
            "1",
            "--no-graph",
            "-T",
            "id",
          ],
          { cwd: consumer, encoding: "utf8" },
        ).trim();
      const rootBefore = consumerOperation();
      // No native inventory exists: UI must not try to read or export one.
      const ui = await snapshot(consumer, join(dir, "ui-snapshot"), null, {
        native: false,
      });
      assert.deepEqual(ui.nativeSources, []);
      assert.notEqual(
        consumerOperation(),
        rootBefore,
        "Desktop's intentional working-copy snapshot remains enabled",
      );
      assert.equal(
        snapshotFile(consumer, ui.revision, "data").toString(),
        "intentional Desktop pending work\n",
      );
      await mkdir(join(consumer, "scripts/validation"), { recursive: true });
      await writeFile(
        join(consumer, "scripts/validation/native-sources.json"),
        JSON.stringify([{ name: "dependency", revision }]),
      );
      const full = await snapshot(consumer, join(dir, "full-snapshot"), null, {
        native: true,
        sourceRoots: { dependency: repository },
      });
      assert.deepEqual(full.nativeSources, sources);
      assert.equal(
        operation(),
        beforeOperation,
        "UI/full export must preserve sibling operation identity",
      );
      assert.equal(
        await readFile(join(repository, "data"), "utf8"),
        beforeBytes,
      );
    } finally {
      if (previousBase === undefined) delete process.env.LAPIS_DESKTOP_BASE;
      else process.env.LAPIS_DESKTOP_BASE = previousBase;
    }
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

test("renderer build heaps stay within half worker memory and do not affect other lanes", async () => {
  const { workerEnvironment, buildEnvironment } = await import(
    "../../scripts/validation/model.mjs"
  );
  for (const memory of [0, undefined, NaN])
    assert.deepEqual(buildEnvironment("build", memory), {});
  for (const lane of ["build", "build-storybook"]) {
    for (const [memoryGiB, heap] of [
      [3, 1536],
      [8, 4096],
      [12, 6144],
      [24, 6144],
    ])
      assert.deepEqual(workerEnvironment("ui", lane, memoryGiB), {
        NODE_OPTIONS: `--max-old-space-size=${heap}`,
      });
  }
  for (const lane of [
    "test",
    "test:ai",
    "test:storybook",
    "check",
    "validation:check",
    "spec:build",
  ])
    for (const target of ["ui", "full"])
      assert.deepEqual(
        workerEnvironment(target, lane, 12),
        workerEnvironment(target),
      );
});

test("native build budgets fall back to physical RAM when no container limit exists", async () => {
  const { totalmem } = await import("node:os");
  const { nativeBuildEnvironment, buildEnvironment } = await import(
    "../../scripts/validation/model.mjs"
  );
  const memory = process.constrainedMemory;
  try {
    process.constrainedMemory = () => 0;
    assert.deepEqual(
      nativeBuildEnvironment("build"),
      buildEnvironment("build", totalmem()),
    );
    assert.deepEqual(nativeBuildEnvironment("test"), {});
  } finally {
    process.constrainedMemory = memory;
  }
});
