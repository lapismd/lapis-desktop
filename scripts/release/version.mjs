import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { changesetBin } from "./changesets.mjs";

export function nextPreviewVersion(version) {
  const match = /^(20\d{2}\.\d+\.\d+)-rc\.([1-9]\d*)$/.exec(version);
  if (!match || !Number.isSafeInteger(Number(match[2]) + 1))
    throw Error("A valid existing preview version is required");
  return `${match[1]}-rc.${Number(match[2]) + 1}`;
}
export function releasePlan(root = process.cwd()) {
  if (
    !readdirSync(join(root, ".changeset")).some(
      (f) => f.endsWith(".md") && f !== "README.md",
    )
  )
    return { releases: [], changesets: [] };
  mkdirSync(join(root, ".local/release"), { recursive: true });
  execFileSync(
    process.execPath,
    [changesetBin, "status", "--output=.local/release/changesets-plan.json"],
    { cwd: root, stdio: "inherit" },
  );
  const plan = JSON.parse(
    readFileSync(join(root, ".local/release/changesets-plan.json"), "utf8"),
  );
  if (
    !Array.isArray(plan.releases) ||
    plan.releases.some((r) => r.name !== "@lapismd/lapis-desktop")
  )
    throw Error("Only the Desktop preview package may be versioned");
  return plan;
}
export function versionDesktop(root = process.cwd()) {
  const read = (p) => readFileSync(join(root, p), "utf8");
  const pkg = JSON.parse(read("package.json")),
    version = nextPreviewVersion(pkg.version);
  for (const [path, pattern] of [
    [
      "src-tauri/Cargo.toml",
      /\[package\]\nname = "lapis-desktop"\nversion = "([^"]+)"/g,
    ],
    [
      "src-tauri/Cargo.lock",
      /\[\[package\]\]\nname = "lapis-desktop"\nversion = "([^"]+)"/g,
    ],
  ]) {
    const matches = [...read(path).matchAll(pattern)];
    if (matches.length !== 1 || matches[0][1] !== pkg.version)
      throw Error("Desktop native version preflight failed");
  }
  if (
    JSON.parse(read("src-tauri/tauri.conf.json")).version !== pkg.version ||
    JSON.parse(read("src-tauri/tauri.preview.conf.json")).bundle?.macOS
      ?.bundleVersion !== pkg.version.split("-rc.")[0]
  )
    throw Error("Desktop bundle version preflight failed");
  const plan = releasePlan(root);
  if (!plan.releases.length) throw Error("No Changesets release intent");
  execFileSync(process.execPath, [changesetBin, "version"], {
    cwd: root,
    stdio: "inherit",
  });
  const generated = JSON.parse(read("package.json"));
  const generatedVersion = generated.version;
  if (generatedVersion === pkg.version)
    throw Error("Changesets did not version the Desktop package");
  const json = (p, change) => {
    const v = JSON.parse(read(p));
    change(v);
    writeFileSync(join(root, p), JSON.stringify(v, null, 2) + "\n");
  };
  json("package.json", (v) => (v.version = version));
  json("src-tauri/tauri.conf.json", (v) => (v.version = version));
  json(
    "src-tauri/tauri.preview.conf.json",
    (v) => (v.bundle.macOS.bundleVersion = version.split("-rc.")[0]),
  );
  for (const [p, pattern] of [
    [
      "src-tauri/Cargo.toml",
      /(\[package\]\nname = "lapis-desktop"\nversion = ")[^"]+("|$)/g,
    ],
    [
      "src-tauri/Cargo.lock",
      /(\[\[package\]\]\nname = "lapis-desktop"\nversion = ")[^"]+("|$)/g,
    ],
  ]) {
    const text = read(p);
    if ([...text.matchAll(pattern)].length !== 1)
      throw Error("Desktop native version entry is missing or ambiguous");
    writeFileSync(
      join(root, p),
      text.replace(pattern, (_, prefix, suffix) => prefix + version + suffix),
    );
  }
  const changelog = read("CHANGELOG.md");
  const heading = `## ${generatedVersion}`;
  if (!changelog.includes(heading))
    throw Error("Changesets changelog heading is missing");
  writeFileSync(
    join(root, "CHANGELOG.md"),
    changelog.replace(heading, `## ${version}`),
  );
  return {
    version,
    previousVersion: pkg.version,
    changesets: plan.changesets.map((c) => c.id),
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  versionDesktop();
