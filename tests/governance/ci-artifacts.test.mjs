import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { artifactProvenance } from "../../scripts/ci-artifact-provenance.mjs";
import {
  buildIdentity,
  digest,
  inventory,
  safePath,
} from "../../scripts/ci-artifact-identity.mjs";
import {
  exportDependencies,
  selectDependencyArtifact,
  verifyDependencies,
} from "../../scripts/ci-dependency-artifact.mjs";
import {
  acceptanceApp,
  exportAcceptance,
  verifyAcceptance,
} from "../../scripts/ci-acceptance-artifact.mjs";

import {
  selectTasksFixture,
  packTasksFixture,
  tasksPackage,
} from "../../scripts/ci-tasks-fixture.mjs";

const inputs = [
  "scripts/ci-sources.json",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  ".node-version",
  "scripts/ci-install.mjs",
  "scripts/ci-prepare-links.mjs",
  "scripts/ci-tasks-fixture.mjs",
  "scripts/ci-dependency-artifact.mjs",
  "scripts/ci-artifact-identity.mjs",
  "scripts/ci-artifact-provenance.mjs",
  "scripts/package-archive-exports.mjs",
  "rust-toolchain.toml",
  "src-tauri/Cargo.toml",
  "src-tauri/Cargo.lock",
  "src-tauri/tauri.conf.json",
  "src-tauri/tauri.e2e.conf.json",
];
function put(root, path, value) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), value);
}
function checkout(parent) {
  const root = join(parent, "producer");
  mkdirSync(root);
  for (const path of inputs) put(root, path, "fixture\n");
  put(root, ".gitignore", ".local/\n");
  put(
    root,
    "scripts/ci-sources.json",
    JSON.stringify([
      {
        name: "lapis-ai",
        repository: "lapismd/lapis-ai",
        revision: "a".repeat(40),
      },
      {
        name: "lapis-plugin-tasks",
        repository: "lapismd/lapis-plugin-tasks",
        revision: "b".repeat(40),
      },
    ]),
  );
  put(
    root,
    "package.json",
    JSON.stringify({ name: "fixture", packageManager: "pnpm@10.34.5" }),
  );
  put(
    root,
    "src-tauri/tauri.conf.json",
    JSON.stringify({ bundle: { macOS: { minimumSystemVersion: "13.0" } } }),
  );
  const git = (...args) =>
    execFileSync("git", args, { cwd: root, stdio: "pipe" });
  git("init");
  git("add", ".");
  git(
    "-c",
    "user.name=Artifact test",
    "-c",
    "user.email=test@localhost",
    "commit",
    "-m",
    "fixture",
  );
  return root;
}

test("dependency archives relocate, verify source/identity and reject changed bytes before use", () => {
  const temporary = mkdtempSync(join(tmpdir(), "ci-dependency-artifact-"));
  try {
    const root = checkout(temporary),
      pkg = join(temporary, "package");
    const tasks = join(temporary, "lapis-plugin-tasks");
    put(
      tasks,
      "package.json",
      JSON.stringify({ name: tasksPackage, version: "0.1.0", files: ["dist"] }),
    );
    put(
      tasks,
      ".desktop-ci-source.json",
      JSON.stringify({
        name: "lapis-plugin-tasks",
        repository: "lapismd/lapis-plugin-tasks",
        revision: "b".repeat(40),
      }),
    );
    put(tasks, "dist/index.js", "export const pinnedTasksFixture = true;\n");
    mkdirSync(pkg);
    writeFileSync(
      join(pkg, "package.json"),
      JSON.stringify({ name: "@lapismd/ai", version: "0.2.0" }),
    );
    const output = ".local/ci-packages/-lapismd-ai/private.tgz";
    mkdirSync(dirname(join(root, output)), { recursive: true });
    execFileSync("tar", [
      "-czf",
      join(root, output),
      "-C",
      temporary,
      "package",
    ]);
    const bytes = readFileSync(join(root, output));
    const tasksArtifact = packTasksFixture(
      join(temporary, "tasks-dependency"),
      root,
    );
    const tasksOutput = join(
      root,
      ".local/ci-packages/-lapis-notes-lapis-plugin-tasks/private.tgz",
    );
    mkdirSync(dirname(tasksOutput), { recursive: true });
    copyFileSync(
      join(temporary, "tasks-dependency", tasksArtifact.path),
      tasksOutput,
    );
    put(
      root,
      ".local/ci-install/archives.json",
      JSON.stringify([
        {
          name: "@lapismd/ai",
          version: "0.2.0",
          sourceRepository: "lapismd/lapis-ai",
          sourceCommit: "a".repeat(40),
          size: bytes.length,
          sha256: digest(bytes),
        },
        {
          name: tasksArtifact.name,
          version: tasksArtifact.version,
          sourceRepository: tasksArtifact.sourceRepository,
          sourceCommit: tasksArtifact.sourceCommit,
          size: tasksArtifact.size,
          sha256: tasksArtifact.sha256,
        },
      ]),
    );
    put(root, ".local/ci-install/package.json", '{"private":true}\n');
    put(root, ".local/ci-install/pnpm-lock.yaml", "lockfileVersion: '9.0'\n");
    const directory = join(temporary, "artifact");
    exportDependencies(directory, root);
    const relocated = join(temporary, "relocated");
    cpSync(directory, relocated, { recursive: true });
    const entries = verifyDependencies(relocated, root);
    assert.equal(entries.length, 3);
    const taskFixture = selectTasksFixture(entries, root);
    const dependency = selectDependencyArtifact(
      [...entries].reverse(),
      tasksPackage,
    );
    assert.equal(dependency.role, "dependency");
    assert.notEqual(dependency.path, taskFixture.path);
    assert.equal(dependency.sha256, taskFixture.sha256);
    assert.throws(
      () => selectDependencyArtifact([taskFixture], tasksPackage),
      /exactly one/,
    );
    assert.throws(
      () => selectDependencyArtifact([dependency, dependency], tasksPackage),
      /exactly one/,
    );
    const manifestPath = join(directory, "manifest.json");
    const originalManifest = readFileSync(manifestPath);
    const manifest = JSON.parse(originalManifest);
    for (const entry of manifest.entries) {
      writeFileSync(
        manifestPath,
        JSON.stringify({ ...manifest, entries: [...manifest.entries, entry] }),
      );
      assert.throws(
        () => verifyDependencies(directory, root),
        /Duplicate dependency artifact/,
      );
    }
    for (const role of [null, false, 0, {}, [], "unknown", "native-fixture"]) {
      const entries = manifest.entries.map((entry) =>
        entry.name === "@lapismd/ai" ? { ...entry, role } : entry,
      );
      writeFileSync(manifestPath, JSON.stringify({ ...manifest, entries }));
      assert.throws(
        () => verifyDependencies(directory, root),
        /Unsupported dependency artifact role/,
      );
    }
    writeFileSync(
      manifestPath,
      JSON.stringify({
        ...manifest,
        entries: manifest.entries.map((entry) => {
          const legacy = { ...entry };
          if (legacy.role === "dependency") delete legacy.role;
          return legacy;
        }),
      }),
    );
    assert.equal(
      selectDependencyArtifact(
        verifyDependencies(directory, root),
        tasksPackage,
      ).sha256,
      dependency.sha256,
    );
    writeFileSync(manifestPath, originalManifest);

    assert.equal(taskFixture.version, "0.1.0");
    assert.equal(taskFixture.source.revision, "b".repeat(40));
    assert.equal(
      execFileSync("tar", ["-xOf", taskFixture.path, "package/dist/index.js"], {
        encoding: "utf8",
      }),
      "export const pinnedTasksFixture = true;\n",
    );
    assert.throws(
      () =>
        selectTasksFixture(
          entries.filter((entry) => entry.name !== tasksPackage),
          root,
        ),
      /missing the pinned Tasks/,
    );
    assert.equal(entries.projectedLock, "lockfileVersion: '9.0'\n");
    const provenanceDirectory = join(temporary, "prior-attempt");
    cpSync(directory, provenanceDirectory, { recursive: true });
    const ci = {
      GITHUB_ACTIONS: "true",
      GITHUB_REPOSITORY: "lapismd/lapis-desktop",
      GITHUB_WORKFLOW_REF:
        "lapismd/lapis-desktop/.github/workflows/ci.yml@refs/pull/9/merge",
      GITHUB_SHA: "c".repeat(40),
      GITHUB_RUN_ID: "12345",
      GITHUB_RUN_ATTEMPT: "1",
    };
    const provenanceManifest = join(provenanceDirectory, "manifest.json");
    const previousAttempt = JSON.parse(readFileSync(provenanceManifest));
    previousAttempt.provenance = artifactProvenance(root, ci);
    writeFileSync(provenanceManifest, JSON.stringify(previousAttempt));
    const savedContext = Object.fromEntries(
      Object.keys(ci).map((name) => [name, process.env[name]]),
    );
    try {
      Object.assign(process.env, ci);
      assert.equal(verifyDependencies(provenanceDirectory, root).length, 3);
      process.env.GITHUB_RUN_ATTEMPT = "2";
      assert.throws(
        () => verifyDependencies(provenanceDirectory, root),
        /producer provenance/,
      );
    } finally {
      for (const [name, value] of Object.entries(savedContext))
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
    }

    assert.ok(entries[0].path.startsWith(relocated));
    writeFileSync(
      join(relocated, "projected-lock.yaml"),
      "changed projected lock",
    );
    assert.throws(
      () => verifyDependencies(relocated, root),
      /projection digest/,
    );
    cpSync(directory, relocated, { recursive: true });
    writeFileSync(entries[0].path, "changed bytes");
    assert.throws(() => verifyDependencies(relocated, root), /AssertionError/);
    put(root, "pnpm-lock.yaml", "changed lock\n");
    assert.throws(() => verifyDependencies(directory, root), /build identity/);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

test("acceptance artifacts bind exact source and preserve bundle links/modes with fresh mutable state", () => {
  const temporary = mkdtempSync(join(tmpdir(), "ci-acceptance-artifact-"));
  const oldPath = process.env.PATH;
  const isolatedEnvironment = {};
  try {
    const root = checkout(temporary);
    const tools = join(temporary, "tools");
    mkdirSync(tools);
    writeFileSync(
      join(tools, "rustc"),
      "#!/bin/sh\necho 'rustc 1.99.0 (fixture)'\n",
    );
    chmodSync(join(tools, "rustc"), 0o755);
    process.env.PATH = `${tools}:${oldPath}`;
    const consumer = join(temporary, "consumer");
    execFileSync("git", ["clone", "--no-hardlinks", root, consumer], {
      stdio: "pipe",
    });
    const binary = `${acceptanceApp}/Contents/MacOS/lapis-desktop`;
    put(
      root,
      binary,
      "acceptance executable TAURI_WEBDRIVER_PORT LAPIS_DESKTOP_ACCEPTANCE_ROOT",
    );
    chmodSync(join(root, binary), 0o755);
    symlinkSync(
      "lapis-desktop",
      join(root, acceptanceApp, "Contents/MacOS/fixture-link"),
    );
    put(root, ".local/acp/native/lapis-acp", "ACP");
    put(root, "src-tauri/resources/lapis-ai/runtime.json", "{}\n");
    put(root, "src-tauri/resources/lapis-cli/lapis", "CLI fixture");
    put(root, ".local/native-tasks/artifact/main.mjs", "export {};\n");
    put(root, ".local/native-tasks/provenance.json", "{}\n");
    put(
      root,
      ".local/native-test/ui/index.html",
      "<!doctype html><p>exact acceptance renderer</p>\n",
    );
    put(root, ".local/native-test/ui/assets/main.js", "export {};\n");
    put(
      root,
      ".local/native-test/http/lapis-desktop",
      "development acceptance executable TAURI_WEBDRIVER_PORT LAPIS_DESKTOP_ACCEPTANCE_ROOT",
    );
    chmodSync(join(root, ".local/native-test/http/lapis-desktop"), 0o755);
    const archive = join(temporary, "wordcount.lapis-plugin"),
      filesDirectory = join(temporary, "plugin-files");
    writeFileSync(archive, "signed public archive");
    writeFileSync(
      join(temporary, "release.signed.json"),
      '{"signed":"portable release"}\n',
    );
    mkdirSync(filesDirectory);
    writeFileSync(join(filesDirectory, "main.mjs"), "export {};\n");
    put(
      root,
      ".local/ci-native-plugins/manifest.json",
      JSON.stringify({
        sourceCommit: "a".repeat(40),
        entries: [
          {
            pluginId: "wordcount",
            archive,
            filesDirectory,
            sha256: digest(readFileSync(archive)),
          },
        ],
      }),
    );
    const artifact = join(temporary, "artifact");
    const acceptedBytes = readFileSync(join(root, binary));
    writeFileSync(
      join(root, binary),
      "ordinary app without acceptance instrumentation",
    );
    assert.throws(
      () => exportAcceptance(artifact, root, isolatedEnvironment),
      /normal native build/,
    );
    writeFileSync(join(root, binary), acceptedBytes);
    const manifest = exportAcceptance(artifact, root, isolatedEnvironment);
    const restored = verifyAcceptance(manifest, consumer, isolatedEnvironment);
    assert.equal(restored.acceptanceBinary, join(consumer, binary));
    assert.deepEqual(
      inventory(join(root, ".local/native-test/ui")),
      inventory(join(consumer, ".local/native-test/ui")),
      "HTTP resource family receives the exact built acceptance renderer",
    );
    assert.deepEqual(
      inventory(join(consumer, acceptanceApp)),
      inventory(join(root, acceptanceApp)),
    );
    const portable = JSON.parse(readFileSync(restored.portableFixtures));
    assert.ok(portable.entries[0].archive.startsWith(consumer));
    assert.equal(
      readFileSync(
        join(
          consumer,
          ".local/ci-native-plugins/resources/wordcount/release.signed.json",
        ),
        "utf8",
      ),
      '{"signed":"portable release"}\n',
    );
    assert.throws(
      () => verifyAcceptance(manifest, consumer, isolatedEnvironment),
      /destination already exists/,
    );
    const originalTree = execFileSync("git", ["rev-parse", "HEAD^{tree}"], {
      cwd: consumer,
      encoding: "utf8",
    });
    execFileSync(
      "git",
      [
        "-c",
        "user.name=Artifact test",
        "-c",
        "user.email=test@localhost",
        "commit",
        "--allow-empty",
        "-m",
        "Different source with identical tree",
      ],
      { cwd: consumer, stdio: "pipe" },
    );
    assert.equal(
      execFileSync("git", ["rev-parse", "HEAD^{tree}"], {
        cwd: consumer,
        encoding: "utf8",
      }),
      originalTree,
    );
    assert.throws(
      () => verifyAcceptance(manifest, consumer, isolatedEnvironment),
      /build identity/,
    );
    put(consumer, ".node-version", "different\n");
    assert.throws(
      () => verifyAcceptance(manifest, consumer, isolatedEnvironment),
      /build identity/,
    );
    assert.equal(buildIdentity(root, "acceptance").sourceCommit.length, 40);
  } finally {
    process.env.PATH = oldPath;
    rmSync(temporary, { recursive: true, force: true });
  }
});

test("artifact resource paths and symlinks cannot escape their retained root", () => {
  const root = mkdtempSync(join(tmpdir(), "artifact-path-"));
  try {
    for (const path of ["../outside", "/absolute", "a/../../outside", "."])
      assert.throws(() => safePath(root, path));
    symlinkSync("../../outside", join(root, "escape"));
    assert.throws(() => inventory(root), /escapes/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
