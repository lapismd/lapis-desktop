import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { hash, validateManifest, repository } from "./contract.mjs";
export async function candidateFiles(directory, prefix = "") {
  const result = [];
  for (const item of await readdir(join(directory, prefix), {
    withFileTypes: true,
  })) {
    const file = prefix ? `${prefix}/${item.name}` : item.name;
    if (
      !/^[a-zA-Z0-9._/-]+$/.test(file) ||
      file.split("/").some((part) => part === ".." || part === ".")
    )
      throw Error("Invalid candidate path");
    if (item.isSymbolicLink())
      throw Error("Candidate assets cannot be symlinks");
    if (item.isDirectory())
      result.push(...(await candidateFiles(directory, file)));
    else if (item.isFile() && file !== "SHA256SUMS") result.push(file);
    else if (!item.isFile()) throw Error("Invalid candidate file");
  }
  return result.sort();
}
export async function sealCandidate(directory) {
  const files = await candidateFiles(directory);
  const sums = await Promise.all(
    files.map(
      async (file) => `${hash(await readFile(join(directory, file)))}  ${file}`,
    ),
  );
  await writeFile(join(directory, "SHA256SUMS"), sums.join("\n") + "\n");
}
export async function verifyCandidate(directory, sourceCommit) {
  const manifest = validateManifest(
    JSON.parse(
      await readFile(join(directory, "desktop-manifest.json"), "utf8"),
    ),
  );
  if (manifest.sourceCommit !== sourceCommit)
    throw Error(
      "Candidate source does not match the approved workflow revision",
    );
  const expected = await candidateFiles(directory);
  const required = [
    manifest.artifacts[0].file,
    "desktop-manifest.json",
    "build-metadata.json",
    "bundle-check.json",
    "LIMITATIONS.md",
    "homebrew-homebrew.json",
    "homebrew-install.json",
    "homebrew-reinstall.json",
  ].sort();
  if (JSON.stringify(expected) !== JSON.stringify(required))
    throw Error("Candidate asset set is incomplete or unexpected");
  const sums = (await readFile(join(directory, "SHA256SUMS"), "utf8"))
    .trim()
    .split("\n");
  const names = [];
  for (const line of sums) {
    const match = /^([a-f0-9]{64})  ([a-zA-Z0-9._/-]+)$/.exec(line);
    if (
      !match ||
      match[2].split("/").some((part) => ["..", "."].includes(part))
    )
      throw Error("Invalid candidate checksum inventory");
    names.push(match[2]);
    if (hash(await readFile(join(directory, match[2]))) !== match[1])
      throw Error(`Candidate asset changed: ${match[2]}`);
  }
  if (JSON.stringify(names.sort()) !== JSON.stringify(expected))
    throw Error("Candidate checksum inventory is incomplete or duplicated");
  const bytes = await readFile(join(directory, manifest.artifacts[0].file));
  if (
    bytes.length !== manifest.artifacts[0].size ||
    hash(bytes) !== manifest.artifacts[0].sha256
  )
    throw Error("Candidate archive identity changed");
  const metadata = JSON.parse(
    await readFile(join(directory, "build-metadata.json"), "utf8"),
  );
  if (
    metadata.sourceCommit !== sourceCommit ||
    metadata.version !== manifest.version ||
    metadata.tag !== manifest.tag ||
    metadata.sourceCI?.sourceCommit !== sourceCommit ||
    metadata.sourceCI?.ciResult !== "success" ||
    metadata.helperProfile !== "release"
  )
    throw Error("Candidate build/source qualification disagrees");
  if (
    !Array.isArray(metadata.privateArchives) ||
    !metadata.privateArchives.length ||
    !Array.isArray(metadata.sources) ||
    metadata.privateArchives.some(
      (entry) =>
        !entry.name ||
        !entry.version ||
        !/^[a-f0-9]{64}$/.test(entry.sha256) ||
        !Number.isSafeInteger(entry.size) ||
        entry.size <= 0 ||
        !/^[a-f0-9]{40}$/.test(entry.sourceCommit) ||
        !metadata.sources.some(
          (source) =>
            source.repository === entry.sourceRepository &&
            source.revision === entry.sourceCommit,
        ),
    )
  )
    throw Error("Missing verified private archive provenance");
  const bundle = JSON.parse(
    await readFile(join(directory, "bundle-check.json"), "utf8"),
  );
  if (
    bundle.result !== "pass" ||
    bundle.normalAutomationMarkers !== 0 ||
    bundle.architectures !== "arm64"
  )
    throw Error("Candidate requires ordinary bundle audit evidence");
  const install = JSON.parse(
    await readFile(join(directory, "homebrew-homebrew.json"), "utf8"),
  );
  if (
    install.ok !== true ||
    install.sourceCommit !== sourceCommit ||
    install.version !== manifest.version ||
    [
      install.install,
      install.reinstall,
      install.uninstall,
      install.retainedProfileAndVault,
      install.audit,
    ].some((value) => value !== "passed")
  )
    throw Error("Candidate requires successful native Homebrew qualification");
  for (const phase of ["install", "reinstall"]) {
    const smoke = JSON.parse(
      await readFile(join(directory, `homebrew-${phase}.json`), "utf8"),
    );
    if (
      !smoke.ok ||
      smoke.sourceCommit !== sourceCommit ||
      smoke.version !== manifest.version ||
      smoke.visibleNativeWindow !== true ||
      smoke.gracefulQuit !== true ||
      smoke.ordinaryBundle !== "verified"
    )
      throw Error("Candidate requires installed ordinary-app smoke evidence");
  }
  if (!(await stat(join(directory, "LIMITATIONS.md"))).size)
    throw Error("Missing native RC limitations");
  return { manifest, metadata, files: [...expected, "SHA256SUMS"], repository };
}
