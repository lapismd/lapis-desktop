import { createRequire } from "node:module";
import { isAbsolute, relative } from "node:path";
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
  hookDirectory,
) {
  const portable = hookDirectory !== undefined;
  const absolute = (value) => typeof value === "string" && isAbsolute(value);
  if (
    portable &&
    (!absolute(hookDirectory) ||
      !absolute(semverModule) ||
      entries.some((entry) => !absolute(entry.tarball)))
  )
    throw new Error(
      "Relocatable archive hooks require admitted absolute inputs",
    );
  if (portable && links.length)
    throw new Error(
      "Relocatable archive hooks cannot admit local source links",
    );
  const packages = [
    ...entries.map(({ name, version, tarball, declared }) => [
      name,
      {
        version,
        ...(portable
          ? { relativeTarball: relative(hookDirectory, tarball) }
          : { target: "file:" + tarball }),
        ...(declared ? { declared } : {}),
      },
    ]),
    ...links.map(({ name, ...entry }) => [name, entry]),
  ];
  const setup = portable
    ? `const path = require("node:path");\nconst semver = require(path.resolve(__dirname, ${JSON.stringify(relative(hookDirectory, semverModule))}));`
    : `const semver = require(${JSON.stringify(semverModule)});`;
  const targets = portable
    ? 'for (const entry of archives.values()) entry.target = "file:" + path.resolve(__dirname, entry.relativeTarball);\n'
    : "";
  return `${setup}
const archives = new Map(${JSON.stringify(packages)});
${targets}const localProjects = new Set(${JSON.stringify(localProjects)});
module.exports = { hooks: { readPackage(pkg) {
  const fields = ["dependencies", "optionalDependencies", "peerDependencies"];
  if (localProjects.has(pkg.name)) fields.push("devDependencies");
  for (const field of fields) {
    for (const [name, entry] of archives) {
      const range = pkg[field]?.[name];
      if (!range) continue;
      const target = ${portable ? "localProjects.has(pkg.name) && entry.declared ? entry.declared : " : ""}entry.target;
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
