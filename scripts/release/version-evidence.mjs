import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
export function versionEvidence(
  { version, previousVersion, changesets },
  root = process.cwd(),
) {
  if (!changesets.every((id) => /^[a-z0-9-]+$/.test(id)))
    throw Error("Invalid Changeset identity");
  const history = join(root, "spec/src/history");
  const numbers = readdirSync(history)
    .map((f) => /^E-RELEASE-(\d+)\.md$/.exec(f)?.[1])
    .filter(Boolean)
    .map(Number);
  const id = `E-RELEASE-${String(Math.max(...numbers, 0) + 1).padStart(3, "0")}`;
  const receipt = `spec/src/history/${id}.md`;
  const files = [
    "package.json",
    ".github/dependency-automation/artifact-projection.json",
    "CHANGELOG.md",
    "src-tauri/Cargo.toml",
    "src-tauri/Cargo.lock",
    "src-tauri/tauri.conf.json",
    "src-tauri/tauri.preview.conf.json",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/navigation/history-01.md",
    receipt,
    ...changesets.map((id) => `.changeset/${id}.md`),
  ];
  const edit = (p, fn) =>
    writeFileSync(join(root, p), fn(readFileSync(join(root, p), "utf8")));
  edit("spec/src/current/desktop.md", (s) =>
    s.split(previousVersion).join(version),
  );
  edit("spec/src/current/governance.md", (s) =>
    s.replace(
      /\[(?:Release|20\d{2}[^\]]+)\]\(distribution\.md\)/,
      `[${version}](distribution.md)`,
    ),
  );
  edit(
    "spec/src/navigation/history-01.md",
    (s) =>
      s.trimEnd() +
      `\n- [Version Desktop preview ${version}](../history/${id}.md)\n`,
  );
  const record = {
    id,
    date: new Date().toISOString().slice(0, 10),
    revision: "enclosing-change",
    result: "pending",
    requirements: ["LD-REL-001", "LD-REL-004"],
    files,
    contractReview:
      "Changesets consumes reviewed Desktop release notes and advances only the existing preview rc number. Package, Cargo, lock, Tauri and bundle versions are synchronized; no npm package or stable cutover is authorized.",
    acceptanceReview:
      "Version preparation is not release acceptance. Full exact-source CI, candidate packaging, native Linux Homebrew qualification and immutable-publication verification must pass after this PR merges.",
    runs: [
      {
        name: "Changesets preview version preparation",
        command: "node scripts/release/version-pr.mjs",
        result: "pass",
        failures: 0,
      },
    ],
    versions: {
      node: process.versions.node,
      changesets: "3.0.3",
      candidate: version,
    },
    remaining: [
      "Full exact-source CI and candidate/native installation qualification",
      "Verified GitHub publication and generated Homebrew update",
    ],
  };
  writeFileSync(
    join(root, receipt),
    "# Desktop Changesets version intent\n\n```json\n" +
      JSON.stringify(record, null, 2) +
      "\n```\n",
  );
  return files;
}
