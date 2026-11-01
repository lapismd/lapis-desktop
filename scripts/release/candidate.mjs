import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";
import {
  hash,
  validateManifest,
  repository,
  releaseTargets,
  targetInfo,
} from "./contract.mjs";
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
  if (manifest.artifacts.length !== releaseTargets.length)
    throw Error(
      "Final candidates require all three targets including both Linux architectures",
    );
  const expected = await candidateFiles(directory);
  const required = [
    ...manifest.artifacts.flatMap((a) => [
      a.file,
      `bundle-check-${a.target}.json`,
      ...["homebrew", "install", "reinstall"].map(
        (phase) => `homebrew-${a.target}-${phase}.json`,
      ),
    ]),
    "desktop-manifest.json",
    "build-metadata.json",
    "LIMITATIONS.md",
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
  const json = async (file) =>
    JSON.parse(await readFile(join(directory, file), "utf8"));
  const metadata = await json("build-metadata.json");
  if (
    metadata.schemaVersion !== 2 ||
    metadata.sourceCommit !== sourceCommit ||
    metadata.version !== manifest.version ||
    metadata.tag !== manifest.tag ||
    metadata.sourceCI?.sourceCommit !== sourceCommit ||
    metadata.sourceCI?.ciResult !== "success" ||
    metadata.sourceCI?.fullQualification !== true ||
    !Array.isArray(metadata.platforms) ||
    metadata.platforms.length !== releaseTargets.length ||
    new Set(metadata.platforms.map((p) => p.target)).size !==
      releaseTargets.length
  )
    throw Error("Candidate build/source qualification disagrees");
  for (const artifact of manifest.artifacts) {
    const bytes = await readFile(join(directory, artifact.file));
    if (bytes.length !== artifact.size || hash(bytes) !== artifact.sha256)
      throw Error("Candidate archive identity changed");
    const info = targetInfo(artifact.target);
    const platform = metadata.platforms.find(
      (p) => p.target === artifact.target,
    );
    const bound = (receipt) =>
      receipt?.target === artifact.target &&
      receipt.artifactSha256 === artifact.sha256 &&
      receipt.sourceCommit === sourceCommit &&
      receipt.version === manifest.version;
    if (
      !bound(platform) ||
      platform.tag !== manifest.tag ||
      platform.helperProfile !== "release" ||
      JSON.stringify(platform.sourceCI) !== JSON.stringify(metadata.sourceCI)
    )
      throw Error("Platform build/source qualification disagrees");
    if (
      !Array.isArray(platform.privateArchives) ||
      !platform.privateArchives.length ||
      !Array.isArray(platform.sources) ||
      platform.privateArchives.some(
        (entry) =>
          !entry.name ||
          !entry.version ||
          !/^[a-f0-9]{64}$/.test(entry.sha256) ||
          !Number.isSafeInteger(entry.size) ||
          entry.size <= 0 ||
          !/^[a-f0-9]{40}$/.test(entry.sourceCommit) ||
          !platform.sources.some(
            (source) =>
              source.repository === entry.sourceRepository &&
              source.revision === entry.sourceCommit,
          ),
      )
    )
      throw Error("Missing verified private archive provenance");
    const bundle = await json(`bundle-check-${artifact.target}.json`);
    if (
      bundle.target !== artifact.target ||
      bundle.artifactSha256 !== artifact.sha256 ||
      bundle.result !== "pass" ||
      bundle.normalAutomationMarkers !== 0 ||
      bundle.architectures !== info.architecture
    )
      throw Error("Candidate requires ordinary bundle audit evidence");
    const install = await json(`homebrew-${artifact.target}-homebrew.json`);
    if (
      !bound(install) ||
      install.ok !== true ||
      [
        install.install,
        install.reinstall,
        install.uninstall,
        install.retainedProfileAndVault,
        install.audit,
      ].some((value) => value !== "passed") ||
      !(
        install.upgrade === "passed" ||
        install.upgrade === "not-run: no previous different preview" ||
        install.upgrade === "not-run: no previous preview for this platform"
      )
    )
      throw Error(
        "Candidate requires successful native Homebrew qualification",
      );
    for (const phase of ["install", "reinstall"]) {
      const smoke = await json(`homebrew-${artifact.target}-${phase}.json`);
      if (
        !bound(smoke) ||
        smoke.ok !== true ||
        smoke.architecture !== info.architecture ||
        smoke.visibleNativeWindow !== true ||
        smoke.gracefulQuit !== true ||
        smoke.nodeDenoOnPath !== false ||
        smoke.ordinaryBundle !== "verified" ||
        smoke.signature !==
          (info.platform === "macos" ? "verified" : "not-applicable")
      )
        throw Error("Candidate requires installed ordinary-app smoke evidence");
    }
  }
  if (!(await stat(join(directory, "LIMITATIONS.md"))).size)
    throw Error("Missing native RC limitations");
  return { manifest, metadata, files: [...expected, "SHA256SUMS"], repository };
}
