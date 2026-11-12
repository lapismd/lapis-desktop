export const gates = [
  "governance",
  "prerequisites",
  "quality",
  "unit",
  "storybook-static",
  "storybook-interaction",
  "bundle",
  "linux",
  "audit",
];
export const unitGroups = ["governance", "renderer", "ai", "rust"];
export const dependencyPlatforms = [
  { os: "macos-15", id: "macos-arm64" },
  { os: "ubuntu-24.04", id: "linux-x64" },
  { os: "ubuntu-24.04-arm", id: "linux-arm64" },
];
export function prerequisitePlatforms(selected) {
  const ids = new Set();
  if (selected.includes("bundle")) ids.add("macos-arm64");
  if (
    [
      "quality",
      "unit",
      "storybook-static",
      "storybook-interaction",
      "audit",
    ].some((gate) => selected.includes(gate))
  )
    ids.add("linux-x64");
  if (selected.includes("linux")) {
    ids.add("linux-x64");
    ids.add("linux-arm64");
  }
  return dependencyPlatforms.filter(({ id }) => ids.has(id));
}
function subset(items, choices) {
  return (
    Array.isArray(items) &&
    new Set(items).size === items.length &&
    items.every((item) => choices.includes(item))
  );
}
function equal(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}
export function validatePlan(plan) {
  if (
    plan?.schemaVersion !== 2 ||
    typeof plan.ordinaryProfilesEnabled !== "boolean" ||
    !["ordinary", "full"].includes(plan.profile) ||
    plan.full !== (plan.profile === "full") ||
    !subset(plan.gates, gates) ||
    !plan.gates.includes("governance") ||
    !subset(plan.unit, unitGroups) ||
    !subset(plan.quality, ["types", "rust"]) ||
    !Array.isArray(plan.nativeFamilies) ||
    plan.nativeFamilies.length !== 0 ||
    !["ordinary", "full"].includes(plan.catalogProfile) ||
    !equal(plan.dependencyPlatforms, prerequisitePlatforms(plan.gates)) ||
    plan.gates.includes("prerequisites") !==
      plan.dependencyPlatforms.length > 0 ||
    plan.gates.includes("unit") !== plan.unit.length > 0 ||
    (plan.rustPackages !== null &&
      (!Array.isArray(plan.rustPackages) ||
        new Set(plan.rustPackages).size !== plan.rustPackages.length ||
        plan.rustPackages.some(
          (name) =>
            typeof name !== "string" || !/^[a-z][a-z0-9_-]*$/u.test(name),
        ))) ||
    (plan.testedRevision !== null &&
      !/^[a-f0-9]{40}$/u.test(plan.testedRevision ?? ""))
  )
    throw Error("Invalid CI plan");
  if (!plan.ordinaryProfilesEnabled && plan.catalogProfile !== "full")
    throw Error(
      "Unqualified narrow ordinary profiles cannot remove existing coverage",
    );
  if (
    plan.full &&
    (!equal(plan.gates, gates) ||
      !equal(plan.unit, unitGroups) ||
      !equal(plan.quality, ["types", "rust"]) ||
      plan.rustPackages !== null ||
      plan.nativeFamilies.length !== 0 ||
      plan.catalogProfile !== "full")
  )
    throw Error("Full qualification requires the complete CI inventory");
  return plan;
}
