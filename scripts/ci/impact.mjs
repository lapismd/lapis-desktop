import { posix } from "node:path";
import {
  gates,
  unitGroups,
  prerequisitePlatforms,
  validatePlan,
} from "./plan-schema.mjs";
import { nativeInventory } from "../native-families.mjs";
export { gates, unitGroups, validatePlan } from "./plan-schema.mjs";
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
export function planChanges(
  files,
  {
    full = false,
    metadata,
    root = "",
    testedRevision = null,
    narrowProfiles = false,
  } = {},
) {
  const selected = new Set(["governance"]),
    units = new Set(),
    quality = new Set(),
    reasons = [];
  let catalogProfile = "ordinary";
  let rustPackages = [],
    all = full || !Array.isArray(files) || !files.length;
  const add = (...names) => names.forEach((n) => selected.add(n));
  const unit = (...names) => {
    add("unit");
    names.forEach((n) => units.add(n));
  };
  const native = () => {
    add("bundle", "linux");
  };
  for (const file of Array.isArray(files) ? files : []) {
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
      catalogProfile = "full";
    } else if (
      file.startsWith("catalog/") ||
      file.startsWith(".storybook/") ||
      /^(?:vite|vitest)\.catalog\./.test(file)
    ) {
      if (!/^catalog\/plugins\/.*\.stories\.ts$/u.test(file)) {
        all = true;
        reasons.push(`Shared catalog presentation: ${file}`);
        continue;
      }
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
      if (
        /^src-tauri\/src\/(?:acceptance\/|host\/(?:windows\/|lifecycle\.rs|state\.rs|database\.rs))/u.test(
          file,
        )
      ) {
        all = true;
        reasons.push(`Shared native infrastructure: ${file}`);
        continue;
      }
      rustPackages = crates;
      add("quality");
      quality.add("rust");
      unit("rust");
      if (crates.includes("lapis-desktop")) {
        // Linux executes enabled portable service cases, including ARM64 quarantines.
        add("linux");
        if (!file.startsWith("src-tauri/tests/")) native();
        else if (file.includes("/tests/fixtures/")) add("quality");
      }
    } else if (file.startsWith("tests/desktop/")) {
      if (!nativeInventory.files.some((entry) => entry.file === file)) {
        all = true;
        reasons.push(`Shared or unmapped native harness: ${file}`);
        continue;
      }
      add("quality", "bundle", "linux");
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
  if (all) {
    const plan = {
      schemaVersion: 2,
      profile: "full",
      full: true,
      ordinaryProfilesEnabled: narrowProfiles,
      testedRevision,
      gates: [...gates],
      unit: [...unitGroups],
      quality: ["types", "rust"],
      rustPackages: null,
      nativeFamilies: [],
      catalogProfile: "full",
      dependencyPlatforms: prerequisitePlatforms(gates),
      reasons: full ? ["Explicit full qualification", ...reasons] : reasons,
    };
    return validatePlan(plan);
  }
  if (!narrowProfiles) {
    catalogProfile = "full";
    reasons.push(
      "Narrow ordinary profiles remain disabled until integrated hosted full/nightly baseline is qualified",
    );
  }
  if (prerequisitePlatforms([...selected]).length) add("prerequisites");
  return validatePlan({
    schemaVersion: 2,
    profile: "ordinary",
    full: false,
    ordinaryProfilesEnabled: narrowProfiles,
    testedRevision,
    gates: gates.filter((g) => selected.has(g)),
    unit: unitGroups.filter((g) => units.has(g)),
    quality: ["types", "rust"].filter((g) => quality.has(g)),
    rustPackages,
    nativeFamilies: [],
    catalogProfile,
    dependencyPlatforms: prerequisitePlatforms([...selected]),
    reasons,
  });
}
export function validateResults(plan, results) {
  validatePlan(plan);
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
