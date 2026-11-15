import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

export function validateArchiveRanges(
  manifest,
  entries,
  semverModule = require.resolve("semver"),
) {
  const semver = require(semverModule);
  for (const { name, version } of entries) {
    const section = [
      "dependencies",
      "devDependencies",
      "optionalDependencies",
    ].find((field) => Object.hasOwn(manifest[field] ?? {}, name));
    if (!section)
      throw new Error(`Archive is not declared by the root: ${name}`);
    const range = manifest[section][name];
    if (!semver.satisfies(version, range, { includePrerelease: true }))
      throw new Error(
        `${name} archive ${version} does not satisfy declared root range ${range}`,
      );
  }
}

export function archiveHookSource(
  entries,
  localProjects = [],
  links = [],
  semverModule = require.resolve("semver"),
) {
  const packages = [
    ...entries.map(({ name, version, tarball, declared }) => [
      name,
      { version, target: "file:" + tarball, ...(declared ? { declared } : {}) },
    ]),
    ...links.map(({ name, ...entry }) => [name, entry]),
  ];
  return `const semver = require(${JSON.stringify(semverModule)});
const archives = new Map(${JSON.stringify(packages)});
const localProjects = new Set(${JSON.stringify(localProjects)});
module.exports = { hooks: { readPackage(pkg) {
  const fields = ["dependencies", "optionalDependencies", "peerDependencies"];
  if (localProjects.has(pkg.name)) fields.push("devDependencies");
  for (const field of fields) {
    for (const [name, entry] of archives) {
      const range = pkg[field]?.[name];
      if (!range) continue;
      const target = entry.target;
      if (field !== "peerDependencies" && range === target) continue;
      const localLink = localProjects.has(pkg.name) && entry.declared === range;
      if (!localLink && !semver.satisfies(entry.version, range, { includePrerelease: true }))
        throw new Error(name + " archive " + entry.version + " does not satisfy " + range);
      if (field === "peerDependencies") {
        // Give peer-only workspace consumers the same verified package identity.
        pkg.dependencies ??= {};
        pkg.dependencies[name] = target;
      } else pkg[field][name] = target;
    }
  }
  return pkg;
} } };\n`;
}
