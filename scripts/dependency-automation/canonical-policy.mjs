export const core = "@lapismd/spec-validator";
export const policyPath = ".github/dependency-automation/canonical-intake.json";
export const chapters = [
  "spec/src/current/governance.md",
  "spec/src/current/local-dependencies.md",
];
export const expectedPolicy = {
  schemaVersion: 1,
  kind: "single-development-dependency",
  repository: "lapismd/lapis-desktop",
  dependency: core,
  slot: "validator-development",
  chapters,
};
