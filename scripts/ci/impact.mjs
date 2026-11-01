import { posix } from "node:path";
export const gates = [
  "governance",
  "quality",
  "unit",
  "storybook-static",
  "storybook-interaction",
  "bundle",
  "headed",
  "linux",
  "audit",
];
export const unitGroups = ["governance", "renderer", "ai", "rust"];
export function affectedCrates(files, metadata, root) {
  if (!metadata?.workspace_members?.length) return null;
  const members = metadata.packages.filter((p) =>
    metadata.workspace_members.includes(p.id),
  );
  const selected = new Set();
  for (const file of files.filter(
    (f) => f.startsWith("src-tauri/") && f.endsWith(".rs"),
  )) {
    const owners = members
      .filter((p) =>
        (root + "/" + file).startsWith(posix.dirname(p.manifest_path) + "/"),
      )
      .sort((a, b) => b.manifest_path.length - a.manifest_path.length);
    if (!owners.length) return null;
    selected.add(owners[0].name);
  }
  let size;
  do {
    size = selected.size;
    for (const p of members)
      if (p.dependencies.some((d) => selected.has(d.name)))
        selected.add(p.name);
  } while (size !== selected.size);
  return [...selected].sort();
}
export function planChanges(files, { full = false, metadata, root = "" } = {}) {
  const selected = new Set(["governance"]),
    units = new Set(),
    quality = new Set(),
    reasons = [];
  let rustPackages = [],
    all = full || !Array.isArray(files) || !files.length;
  const add = (...names) => names.forEach((n) => selected.add(n));
  const unit = (...names) => {
    add("unit");
    names.forEach((n) => units.add(n));
  };
  const native = () => add("bundle", "headed", "linux");
  for (const file of files || []) {
    if (
      typeof file !== "string" ||
      file.startsWith("/") ||
      file.split("/").some((p) => !p || p === "." || p === "..") ||
      file.includes("\\") ||
      /[\r\n\0]/.test(file)
    ) {
      all = true;
      reasons.push("Invalid changed path");
      continue;
    }
    if (
      /^(?:[^/]+\.md|docs\/.*\.md|spec\/src\/.*\.md|spec\/book\.toml)$/.test(
        file,
      )
    ) {
      reasons.push(`Documentation: ${file}`);
      continue;
    }
    if (
      file.startsWith("src/") ||
      file.startsWith("public/") ||
      file === "index.html"
    ) {
      add("quality", "storybook-static", "storybook-interaction");
      unit("governance", "renderer", "ai");
      quality.add("types");
      native();
    } else if (
      file.startsWith("catalog/") ||
      file.startsWith(".storybook/") ||
      /^(?:vite|vitest)\.catalog\./.test(file)
    ) {
      add("quality", "storybook-static", "storybook-interaction");
      quality.add("types");
      unit("governance");
    } else if (file.startsWith("src-tauri/") && file.endsWith(".rs")) {
      const crates = affectedCrates(files, metadata, root);
      if (!crates?.length) {
        all = true;
        reasons.push("Unresolved native crate ownership");
        continue;
      }
      rustPackages = crates;
      add("quality");
      quality.add("rust");
      unit("rust");
      if (crates.includes("lapis-desktop")) {
        if (!file.startsWith("src-tauri/tests/")) native();
        else if (file.includes("/tests/fixtures/")) add("headed");
      }
    } else if (file.startsWith("tests/desktop/")) {
      add("headed", "quality");
      unit("governance");
    } else if (file.startsWith("tests/renderer/")) {
      add("quality");
      unit("governance", "renderer");
    } else if (file.startsWith("tests/ai/")) {
      add("quality");
      unit("governance", "ai");
    } else if (
      file.startsWith("scripts/release/") ||
      file.startsWith("tests/governance/release-") ||
      file === ".github/workflows/release-desktop.yml"
    ) {
      add("quality");
      unit("governance");
    } else if (
      file.startsWith("tests/governance/") &&
      !file.includes("ci-selection")
    ) {
      add("quality");
      unit("governance");
    } else {
      all = true;
      reasons.push(`Shared configuration or unknown impact: ${file}`);
      continue;
    }
    reasons.push(`Affected consumers: ${file}`);
  }
  if (all)
    return {
      schemaVersion: 1,
      full: true,
      gates: [...gates],
      unit: [...unitGroups],
      quality: ["types", "rust"],
      rustPackages: null,
      reasons: full ? ["Explicit full qualification", ...reasons] : reasons,
    };
  return {
    schemaVersion: 1,
    full: false,
    gates: gates.filter((g) => selected.has(g)),
    unit: unitGroups.filter((g) => units.has(g)),
    quality: ["types", "rust"].filter((g) => quality.has(g)),
    rustPackages,
    reasons,
  };
}
export function validateResults(plan, results) {
  if (
    plan?.schemaVersion !== 1 ||
    !Array.isArray(plan.gates) ||
    !plan.gates.includes("governance") ||
    new Set(plan.gates).size !== plan.gates.length ||
    plan.gates.some((g) => !gates.includes(g))
  )
    throw Error("Invalid CI plan");
  for (const gate of gates) {
    const actual = results[gate];
    if (
      plan.gates.includes(gate)
        ? actual !== "success"
        : !["success", "skipped"].includes(actual)
    )
      throw Error(
        `CI gate ${gate} finished ${actual ?? "missing"}; selected=${plan.gates.includes(gate)}`,
      );
  }
}
