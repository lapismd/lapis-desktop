import { createHash } from "node:crypto";
import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

// Release asset SHA-256 identities from the owning upstream releases.
const pins = {
  x64: [
    [
      "jj",
      "jj-v0.45.1-x86_64-unknown-linux-musl.tar.gz",
      "f35438350b5d61963aac5dd74ede510b31d6b9690769d1a6268cf058cc825f72",
      "543032052",
    ],
    [
      "mdBook",
      "mdbook-v0.5.4-x86_64-unknown-linux-musl.tar.gz",
      "5222beabd3e37dc5be0d18ff99b79058469354db5c220153a1b92db5ba12be89",
      "468209670",
    ],
  ],
  arm64: [
    [
      "jj",
      "jj-v0.45.1-aarch64-unknown-linux-musl.tar.gz",
      "7349a43dd5a20dbc998b10114daa0ee63d2ab863fb822c7eb6b0ebca5903cc69",
      "543031340",
    ],
    [
      "mdBook",
      "mdbook-v0.5.4-aarch64-unknown-linux-musl.tar.gz",
      "753e5c5c363ee8a56972344dcf91466f005a51db84a7aeffe427ae3ef83d6d44",
      "468210015",
    ],
  ],
};
const darwin = {
  arm64: [
    [
      "jj",
      "jj-v0.45.1-aarch64-apple-darwin.tar.gz",
      "51ba42e3d0682616f6eb015045bfe45289b396f03511f9897f645ce8e9272743",
      "543036998",
    ],
    [
      "mdBook",
      "mdbook-v0.5.4-aarch64-apple-darwin.tar.gz",
      "03e8a6d8b13a2971e0b3280affd03b388373c1485e26f73407c3a76b0b1838df",
      "468209418",
    ],
  ],
};
const vectorscan = {
  "linux-x64": {
    assetId: "588760607",
    target: "x86_64-unknown-linux-gnu",
    digest: "669852726c3ae96edf7f876992d7e611e3b3aca6353f3f934439d40ef5b20e13",
  },
  "linux-arm64": {
    assetId: "588760581",
    target: "aarch64-unknown-linux-gnu",
    digest: "5a5e8c4d2ac633af9a5930d7898f783946a57f0859dd5abfd15c0ecdc27f1494",
  },
  "darwin-arm64": {
    assetId: "588760583",
    target: "aarch64-apple-darwin",
    digest: "8986ceddd414bd74cf9dfacfe7ec1536c4b2e46141e3ab37421e7e541d44bf1f",
  },
};
export function vectorscanPin(platform, arch) {
  const selected = vectorscan[`${platform}-${arch}`];
  if (!selected) throw Error("Unsupported Vectorscan archive platform");
  return {
    ...selected,
    asset: `vectorscan-0.1.1-${selected.target}.tar.gz`,
  };
}
export function toolPins(platform, arch, onlyJj) {
  if (platform === "darwin") {
    if (!darwin[arch]) throw Error("Unsupported container toolchain platform");
    return onlyJj
      ? darwin[arch].filter(([tool]) => tool === "jj")
      : darwin[arch];
  }
  if (platform !== "linux" || !pins[arch])
    throw Error("Unsupported container toolchain platform");
  return pins[arch];
}
export function archiveMember(members, executable) {
  const matches = members
    .split("\n")
    .filter((path) => path.replace(/^\.\//, "") === executable);
  if (matches.length !== 1)
    throw Error("Archive must contain exactly one root executable");
  return matches[0];
}
export async function install(
  directory = "/opt/tools",
  onlyJj = false,
  platform = process.platform,
  arch = process.arch,
) {
  const selected = toolPins(platform, arch, onlyJj);
  await mkdir(directory, { recursive: true });
  for (const [tool, asset, digest, assetId] of selected) {
    if (onlyJj && tool !== "jj") continue;
    const owner = tool === "jj" ? "jj-vcs/jj" : "rust-lang/mdBook";
    const version = tool === "jj" ? "0.45.1" : "0.5.4";
    const response = await fetch(
      `https://api.github.com/repos/${owner}/releases/assets/${assetId}`,
      { headers: { Accept: "application/octet-stream" } },
    );
    if (!response.ok) throw Error("Tool download failed: " + response.status);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (createHash("sha256").update(bytes).digest("hex") !== digest)
      throw Error("Tool archive checksum mismatch: " + tool);
    const archive = "/tmp/" + asset;
    await writeFile(archive, bytes);
    const executable = tool === "jj" ? "jj" : "mdbook";
    const member = archiveMember(
      execFileSync("tar", ["-tzf", archive], { encoding: "utf8" }),
      executable,
    );
    execFileSync("tar", ["-xzf", archive, "-C", directory, member]);
    await chmod(join(directory, executable), 0o755);
    if (platform === process.platform && arch === process.arch) {
      const actual = execFileSync(join(directory, executable), ["--version"], {
        encoding: "utf8",
      }).trim();
      if (
        !actual.startsWith(
          executable + (tool === "mdBook" ? " v" : " ") + version,
        )
      )
        throw Error("Tool version mismatch: " + actual);
    }
    await rm(archive);
  }
}
export const bundlePlatforms = [
  ["linux", "x64"],
  ["linux", "arm64"],
  ["darwin", "arm64"],
];
export async function installBundle(directory) {
  const platforms = {};
  for (const [platform, arch] of bundlePlatforms) {
    const key = `${platform}-${arch}`;
    const target = join(directory, key);
    await install(target, false, platform, arch);
    platforms[key] = { executables: {}, archives: {} };
    for (const [tool] of toolPins(platform, arch, false)) {
      const executable = tool === "jj" ? "jj" : "mdbook";
      platforms[key].executables[executable] = createHash("sha256")
        .update(await readFile(join(target, executable)))
        .digest("hex");
    }
    const archive = vectorscanPin(platform, arch);
    const response = await fetch(
      `https://api.github.com/repos/micksmix/kingfisher-vectorscan/releases/assets/${archive.assetId}`,
      { headers: { Accept: "application/octet-stream" } },
    );
    if (!response.ok)
      throw Error("Vectorscan archive download failed: " + response.status);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (createHash("sha256").update(bytes).digest("hex") !== archive.digest)
      throw Error("Vectorscan archive checksum mismatch");
    await writeFile(join(target, archive.asset), bytes);
    platforms[key].archives[archive.asset] = archive.digest;
  }
  const manifest = { schemaVersion: 2, platforms };
  await writeFile(
    join(directory, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  return manifest;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const bundle = process.argv.find((value) => value.startsWith("--bundle="));
  if (bundle) {
    await installBundle(bundle.slice("--bundle=".length));
  } else await install();
}
