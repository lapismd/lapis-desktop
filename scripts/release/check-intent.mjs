import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { managedMaintenanceNote } from "../dependency-automation/maintenance-note.mjs";
export function requireReleaseIntent(files, { versionChange = false } = {}) {
  const product = files.some((f) => /^(?:src\/|src-tauri\/|public\/)/.test(f));
  const note = files.some(
    (f) =>
      /^\.changeset\/(?!README\.md$)[a-z0-9-]+\.md$/.test(f) &&
      !managedMaintenanceNote(f),
  );
  if (product && !note && !versionChange)
    throw Error("Desktop product changes require a new Changeset");
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  if (event.pull_request) {
    const base = event.pull_request.base.sha,
      head = event.pull_request.head.sha;
    if (![base, head].every((s) => /^[a-f0-9]{40}$/.test(s)))
      throw Error("Changeset gate requires exact PR revisions");
    const changes = execFileSync(
      "git",
      ["diff", "--name-status", "--no-renames", `${base}...${head}`],
      { encoding: "utf8" },
    )
      .trim()
      .split("\n")
      .map((s) => s.split("\t"));
    const files = changes.map(([, path]) => path);
    const before = JSON.parse(
      execFileSync("git", ["show", `${base}:package.json`], {
        encoding: "utf8",
      }),
    );
    const current = JSON.parse(readFileSync("package.json", "utf8"));
    const versionFiles = new Set([
      "package.json",
      ".github/dependency-automation/artifact-projection.json",
      "pnpm-lock.yaml",
      "CHANGELOG.md",
      "src-tauri/Cargo.toml",
      "src-tauri/Cargo.lock",
      "src-tauri/tauri.conf.json",
      "src-tauri/tauri.preview.conf.json",
      "spec/src/current/desktop.md",
      "spec/src/current/governance.md",
      "spec/src/navigation/history-01.md",
    ]);
    const versionChange =
      current.version !== before.version &&
      files.every(
        (f) =>
          versionFiles.has(f) ||
          /^\.changeset\/[a-z0-9-]+\.md$/.test(f) ||
          /^spec\/src\/history\/E-RELEASE-\d+\.md$/.test(f),
      );
    const added = changes.filter(
      ([status, path]) =>
        status === "A" &&
        /^\.changeset\/[a-z0-9-]+\.md$/.test(path) &&
        !managedMaintenanceNote(path),
    );
    requireReleaseIntent(
      files
        .filter((f) => !f?.startsWith(".changeset/"))
        .concat(added.map(([, f]) => f)),
      { versionChange },
    );
    for (const [, path] of added)
      if (
        !existsSync(path) ||
        !/["']@lapismd\/lapis-desktop["']:\s*(patch|minor|major)/.test(
          readFileSync(path, "utf8"),
        )
      )
        throw Error(
          "Changeset must name the Desktop package and release intent",
        );
    if (added.length) {
      execFileSync(
        process.execPath,
        ["scripts/release/changesets.mjs", "status", "--since", base],
        { stdio: "inherit" },
      );
    }
  }
}
