import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import semver from "semver";

// Order dependencies before their consumers. Names are read from public manifests.
export const localSourceGroups = [
  {
    repo: "mira-mde",
    dirs: [
      "packages/mira-editor",
      "packages/mira-plugin-ai",
      "packages/mira-plugin-mermaid",
      "packages/mira",
    ],
    build: ["build"],
  },
  { repo: "design-core", dirs: ["."] },
  {
    repo: "agent-ui",
    dirs: ["packages/agent-ui", "packages/repository-ui"],
    build: ["build"],
  },
  { repo: "agent-redaction", dirs: ["."], build: ["build"] },
  { repo: "ai-host", dirs: ["."], build: ["build"] },
  {
    repo: "lapis-notes",
    dirs: [
      "packages/ui",
      "packages/api",
      "packages/language-service",
      "packages/file-explorer",
      "packages/workspace",
    ],
  },
  {
    repo: "lapis-plugins",
    dirs: [
      "packages/source-editor",
      "packages/markdown",
      "packages/search",
      "packages/graph",
    ],
  },
  { repo: "spec-validator", dirs: ["."], build: ["build:node"] },
  {
    repo: "lapis-terminal",
    dirs: ["packages/terminal"],
    inputs: ["crates", "Cargo.toml", "Cargo.lock"],
  },
  {
    repo: "lapis-ai",
    dirs: ["packages/ai"],
    inputs: ["crates", "Cargo.toml", "Cargo.lock"],
  },
  {
    repo: "jj-store",
    dirs: ["packages/jj-history", "packages/jj-conversations"],
    inputs: ["crates", "Cargo.toml", "Cargo.lock"],
  },
];

export function jj(root, ...args) {
  return execFileSync("jj", ["--no-pager", ...args], {
    cwd: root,
    encoding: "utf8",
  }).trim();
}

/** An unnamed working copy is not a release input; named empty commits are. */
export function committedSource(root, dirs) {
  const description = jj(
    root,
    "log",
    "-r",
    "@",
    "--no-graph",
    "-T",
    "description",
  );
  const dirty = jj(root, "diff", "--name-only");
  const ref = description && !dirty ? "@" : "@-";
  const revision = jj(root, "log", "-r", ref, "--no-graph", "-T", "commit_id");
  const changes = jj(
    root,
    "diff",
    "--from",
    revision,
    "--to",
    "@",
    "--name-only",
    "--",
    ...[
      ...new Set([
        ...dirs,
        "package.json",
        "pnpm-lock.yaml",
        "pnpm-workspace.yaml",
        "scripts",
        "tsconfig.json",
      ]),
    ].map((path) =>
      path === "." ? "glob:**" : `glob:${path}${extname(path) ? "" : "/**"}`,
    ),
    ...["json", "js", "mjs", "ts", "yaml", "toml", "lock"].map(
      (extension) => `glob:*.${extension}`,
    ),
  );
  assert.equal(
    changes,
    "",
    `Uncommitted package/build inputs in ${root}: ${changes}`,
  );
  return revision;
}

export function sourceWorkspaceRoots(
  value = process.env.LAPIS_DESKTOP_SOURCE_WORKSPACES,
) {
  if (!value) return {};
  const roots = JSON.parse(value);
  assert.ok(
    roots && !Array.isArray(roots) && typeof roots === "object",
    "Source workspaces must be an object",
  );
  for (const [name, path] of Object.entries(roots)) {
    assert.ok(
      localSourceGroups.some((group) => group.repo === name),
      `Unknown source repository: ${name}`,
    );
    assert.ok(
      typeof path === "string" && path.startsWith("/"),
      `Source workspace must be absolute: ${name}`,
    );
  }
  return roots;
}

export function dependencySources(desktopRoot, roots = sourceWorkspaceRoots()) {
  const manifest = JSON.parse(
    readFileSync(join(desktopRoot, "package.json"), "utf8"),
  );
  const declared = { ...manifest.dependencies, ...manifest.devDependencies };
  const groups = localSourceGroups.map((group) => {
    const root = roots[group.repo] ?? resolve(desktopRoot, "..", group.repo);
    const revision = committedSource(root, [
      ...group.dirs,
      ...(group.inputs ?? []),
    ]);
    const packages = group.dirs.map((directory) => {
      const packageRoot = join(root, directory);
      const pkg = JSON.parse(
        readFileSync(join(packageRoot, "package.json"), "utf8"),
      );
      assert.ok(
        declared[pkg.name],
        `Declare local dependency ${pkg.name} in Desktop`,
      );
      return {
        name: pkg.name,
        version: pkg.version,
        root: packageRoot,
        directory,
        manifest: pkg,
        linked: declared[pkg.name].startsWith("link:"),
      };
    });
    return { ...group, root, revision, packages };
  });
  const packages = groups.flatMap((group) => group.packages);
  assertDependencyCompatibility(
    [{ dependencies: declared }, ...packages.map((pkg) => pkg.manifest)],
    new Map(packages.map((pkg) => [pkg.name, pkg.version])),
  );
  return groups;
}

/** Reject incompatible source cohorts before builds or the review-app quit. */
export function assertDependencyCompatibility(manifests, versions) {
  for (const pkg of manifests)
    for (const field of [
      "dependencies",
      "optionalDependencies",
      "peerDependencies",
    ])
      for (const [name, range] of Object.entries(pkg[field] ?? {})) {
        if (!/^@(lapismd|lapis-notes)\//u.test(name)) continue;
        assert.ok(versions.has(name), `Missing local source mapping: ${name}`);
        const workspaceRange = range.startsWith("workspace:")
          ? range.slice(10)
          : range;
        const resolvedRange =
          ["*", "~", "^"].includes(workspaceRange) &&
          range.startsWith("workspace:")
            ? "*"
            : workspaceRange;
        if (!range.startsWith("link:"))
          assert.ok(
            semver.satisfies(versions.get(name), resolvedRange, {
              includePrerelease: true,
            }),
            `${pkg.name ?? "Desktop"}: ${name} source ${versions.get(name)} does not satisfy ${range}`,
          );
      }
}
