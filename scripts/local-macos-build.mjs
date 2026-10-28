#!/usr/bin/env node
// Build an unsigned, ad-hoc signed macOS app for local testing and install every
// first-party plugin the app does not already statically bundle. Local-only:
// this lane is never collected by CI or a default validation lane.
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = (name) => join(root, "..", name);
const pluginsRepo = repo("lapis-plugins");
const notebookRepo = repo("lapis-plugin-notebook");

// Plugins the desktop app already registers statically (see
// src/components/views/notes-bundled-plugins.ts and src/lib/notes/notes-plugins.ts)
// or that are shell-embedded. Installing them again through .lapis/plugins would
// duplicate their registration, so they are intentionally skipped.
const STATICALLY_BUNDLED = new Set([
  "ai",
  "source-editor",
  "markdown",
  "search",
  "graph",
  "file-explorer",
  "terminal",
]);

const APP_PRODUCT_NAME = "Lapis Notes Preview";
const releaseApp = join(
  root,
  "src-tauri",
  "target",
  "release",
  "bundle",
  "macos",
  `${APP_PRODUCT_NAME}.app`,
);
const debugApp = join(
  root,
  "src-tauri",
  "target",
  "debug",
  "bundle",
  "macos",
  `${APP_PRODUCT_NAME}.app`,
);

function usage() {
  process.stderr.write(`Usage: node scripts/local-macos-build.mjs [flags]

Builds the macOS app (release profile by default) and installs first-party
plugins into a vault's .lapis/ directory so they load on next launch.

  --vault <path>       Write .lapis/plugins + installed-plugins.json into this
                       vault path (default: leave plugins staged under
                       .local/local-app/plugins without touching a vault).
  --debug              Build the app with the Cargo debug profile (faster).
  --run                Launch the built app after signing.
  --skip-app           Skip the macOS app build (plugin install only).
  --skip-plugins       Skip building/installing plugins.
  --only <ids,...>     Install only these app plugin ids (comma separated).
`);
  process.exit(1);
}

const argv = process.argv.slice(2);
const flags = {
  vault: null,
  debug: false,
  run: false,
  skipApp: false,
  skipPlugins: false,
  only: null,
};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--vault") flags.vault = resolve(argv[++i]);
  else if (a === "--debug") flags.debug = true;
  else if (a === "--run") flags.run = true;
  else if (a === "--skip-app") flags.skipApp = true;
  else if (a === "--skip-plugins") flags.skipPlugins = true;
  else if (a === "--only") flags.only = new Set(argv[++i].split(","));
  else usage();
}

function fail(message) {
  process.stderr.write(`local-macos-build: ${message}\n`);
  process.exit(1);
}

// --- guards ---------------------------------------------------------------
if (process.platform !== "darwin" || process.arch !== "arm64") {
  fail("local macOS app builds require macOS on Apple Silicon (darwin/arm64).");
}
for (const key of [
  "TAURI_SIGNING_IDENTITY",
  "APPLE_SIGNING_IDENTITY",
  "TAURI_APPLE_SIGNING_IDENTITY",
]) {
  if (process.env[key])
    fail(
      `${key} is set; refusing to build with a real signing identity (ad-hoc only).`,
    );
}

function freeGiB() {
  const out = execFileSync("df", ["-g", "."], { encoding: "utf8" });
  return Number(out.trim().split("\n").at(-1).split(/\s+/).at(-2));
}
if (freeGiB() < 30)
  fail("less than 30 GiB free; refusing the heavy release build.");
for (const proc of ["cargo", "rustc", "rustup"]) {
  const { stdout } = spawnSync("pgrep", ["-x", proc], { encoding: "utf8" });
  if (stdout.trim())
    fail(
      `a ${proc} process is running; retry after it finishes (serialized Mac build slot).`,
    );
}

function run(cmd, args, cwd, env = {}) {
  const code = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, ...env },
  }).status;
  if (code !== 0) fail(`${cmd} ${args.join(" ")} failed (${code}).`);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

const now = () => new Date().toISOString();

// --- build the app (ad-hoc signed) ----------------------------------------
function appPath() {
  return flags.debug ? debugApp : releaseApp;
}

function buildApp() {
  run("pnpm", ["ai:prepare", "--", "--reuse"], root, {
    LAPIS_DESKTOP_VALIDATION_RUNTIME: "native",
  });
  const args = flags.debug
    ? ["exec", "tauri", "build", "--debug", "--bundles", "app"]
    : ["desktop:bundle"];
  run("pnpm", args, root, {
    LAPIS_DESKTOP_VALIDATION_RUNTIME: "native",
    MACOSX_DEPLOYMENT_TARGET: "13.0",
    ...(flags.debug ? { CARGO_BUILD_JOBS: "2" } : {}),
  });
  const app = appPath();
  if (!existsSync(app)) fail(`app bundle not found at ${app}`);
  // arm64 already ad-hoc signs the Mach-O at link time; re-sign the bundle to
  // cover nested frameworks/resources, then prove it is launchable.
  run("codesign", ["--force", "--deep", "--sign", "-", app]);
  run("xattr", ["-cr", app]); // no quarantine, so Finder launches it directly
  run("codesign", ["--verify", "--deep", "--strict", app]);
  process.stdout.write(`Built and ad-hoc signed: ${app}\n`);
}

// --- build + install plugins ----------------------------------------------
function walkFiles(dir, base = realpathSync(dir)) {
  const files = [];
  const visit = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      const real = realpathSync(full);
      if (statSync(real).isDirectory()) visit(real);
      else files.push(real);
    }
  };
  visit(realpathSync(dir));
  return files.map((real) => relative(base, real));
}

function pluginRecord(id, version, srcDir) {
  const files = walkFiles(srcDir)
    .sort()
    .map((path) => {
      const bytes = readFileSync(join(srcDir, path));
      return { path, sha256: sha256(bytes), size: bytes.length };
    });
  const now = new Date().toISOString();
  return {
    pluginId: id,
    installedVersion: version,
    installedAt: now,
    updatedAt: now,
    provenance: "development",
    files,
  };
}

function readRelease(pkgDir) {
  const releaseJson = join(pkgDir, "release.json");
  if (!existsSync(releaseJson)) return null;
  return JSON.parse(readFileSync(releaseJson, "utf8"));
}

function installPlugins() {
  // 1. Build every official plugin payload so .release/plugins is fresh.
  run("pnpm", ["plugin:build"], pluginsRepo, {
    LAPIS_PLUGINS_VALIDATION_RUNTIME: "native",
  });
  const outDir = join(root, ".local", "local-app", "plugins");
  mkdirSync(outDir, { recursive: true });

  const records = [];

  // 2. lapis-plugins official payloads.
  const releaseDir = join(pluginsRepo, ".release", "plugins");
  for (const entry of readdirSync(releaseDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const release = readRelease(join(releaseDir, entry.name));
    if (!release || release.type !== "lapis.plugin.release") continue;
    const id = release.pluginId;
    if (STATICALLY_BUNDLED.has(id)) continue;
    if (flags.only && !flags.only.has(id)) continue;
    const srcDir = join(releaseDir, entry.name, "files");
    records.push({ id, version: release.version, srcDir, files: release.files });
  }

  // 3. Notebook (bundle-ready dist with its own runtime entry). Its pnpm build
  //    routes through the repo's Docker validation runner, so fall back to an
  //    already-built dist/ when the heavy rebuild is unavailable locally.
  if (!flags.only || flags.only.has("lapis-notebook")) {
    const built = spawnSync("pnpm", ["build"], {
      cwd: notebookRepo,
      stdio: "inherit",
      env: process.env,
    }).status;
    if (built !== 0)
      process.stdout.write(
        "Notebook validation build failed; using existing dist/ if present.\n",
      );
    const notebookManifest = join(notebookRepo, "dist", "manifest.json");
    if (existsSync(notebookManifest)) {
      const manifest = JSON.parse(readFileSync(notebookManifest, "utf8"));
      const version = JSON.parse(
        readFileSync(join(notebookRepo, "package.json"), "utf8"),
      ).version;
      records.push({
        id: manifest.id ?? "lapis-notebook",
        version,
        srcDir: join(notebookRepo, "dist"),
        files: null,
      });
    } else {
      process.stdout.write("Skipping notebook: no dist/ bundle available.\n");
    }
  }

  // 4. Materialize each plugin: copy into the throwaway stage (and into the
  //    vault when --vault is given), then write installed-plugins.json.
  const pluginsDir = flags.vault
    ? join(flags.vault, ".lapis", "plugins")
    : join(outDir, ".lapis", "plugins");
  mkdirSync(pluginsDir, { recursive: true });
  const state = {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    plugins: {},
  };
  for (const { id, version, srcDir, files } of records) {
    const dest = join(pluginsDir, id);
    mkdirSync(dest, { recursive: true });
    // Follow symlinks so deduplicated shared plugin assets are materialized as
    // real bytes (the native asset route validates path/sha256/size of bytes).
    cpSync(srcDir, dest, { recursive: true, dereference: true, force: true });
    state.plugins[id] = files
      ? {
          pluginId: id,
          installedVersion: version,
          installedAt: now(),
          updatedAt: now(),
          provenance: "development",
          files,
        }
      : pluginRecord(id, version, dest);
    process.stdout.write(
      `Installed ${id}@${version} (${state.plugins[id].files.length} files)\n`,
    );
  }
  const statePath = flags.vault
    ? join(flags.vault, ".lapis", "installed-plugins.json")
    : join(outDir, "installed-plugins.json");
  writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n");
  process.stdout.write(
    flags.vault
      ? `Installed ${Object.keys(state.plugins).length} plugins into ${flags.vault}/.lapis/\n`
      : `Staged ${Object.keys(state.plugins).length} plugins (no --vault given): ${statePath}\n` +
          `Point the app at a vault, then run: node scripts/local-macos-build.mjs --skip-app --vault <path>\n`,
  );
  if (flags.vault && !flags.only) {
    // Sanity: every declared plugin ID is reserved-safe for development provenance.
    for (const id of Object.keys(state.plugins)) {
      if (id.startsWith("lapis-"))
        process.stdout.write(
          `  (reserved-id ${id}, development provenance — allowed)\n`,
        );
    }
  }
}

if (!flags.skipApp) buildApp();
if (!flags.skipPlugins) installPlugins();
if (flags.run) {
  run("open", [appPath()]);
}
