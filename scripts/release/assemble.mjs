import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
  createManifest,
  hash,
  hostedMain,
  readIdentity,
  releaseTargets,
} from "./contract.mjs";

hostedMain();
const identity = readIdentity();
const output = resolve(".local/release/candidate");
await mkdir(output, { recursive: true });
const artifacts = [],
  platforms = [];
for (const { target } of releaseTargets) {
  const directory = resolve(".local/release/parts", target);
  const part = JSON.parse(await readFile(join(directory, "part.json"), "utf8"));
  if (
    part.artifact.target !== target ||
    part.metadata.sourceCommit !== identity.sourceCommit ||
    part.metadata.version !== identity.version ||
    part.metadata.tag !== identity.tag ||
    part.metadata.target !== target ||
    part.bundle.target !== target ||
    part.metadata.artifactSha256 !== part.artifact.sha256 ||
    part.bundle.artifactSha256 !== part.artifact.sha256
  )
    throw Error("Platform part identity disagrees with the candidate");
  const bytes = await readFile(join(directory, part.artifact.file));
  if (
    bytes.length !== part.artifact.size ||
    hash(bytes) !== part.artifact.sha256
  )
    throw Error("Platform archive changed before assembly");
  await cp(
    join(directory, part.artifact.file),
    join(output, part.artifact.file),
  );
  await writeFile(
    join(output, `bundle-check-${target}.json`),
    JSON.stringify(part.bundle, null, 2) + "\n",
  );
  artifacts.push(part.artifact);
  platforms.push(part.metadata);
}
const manifest = createManifest(identity, artifacts);
if (
  platforms.some(
    (p) => JSON.stringify(p.sourceCI) !== JSON.stringify(platforms[0].sourceCI),
  )
)
  throw Error("Platform builds disagree on source CI qualification");
await writeFile(
  join(output, "desktop-manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
await writeFile(
  join(output, "build-metadata.json"),
  JSON.stringify(
    {
      schemaVersion: 2,
      ...identity,
      sourceCI: platforms[0].sourceCI,
      platforms,
    },
    null,
    2,
  ) + "\n",
);
const backlog = await readFile("spec/src/backlog/distribution.md", "utf8");
const limitations = backlog
  .split("## Hosted ARM64 case quarantine")[1]
  ?.split("\n## ")[0]
  ?.trim();
if (!limitations)
  throw Error("Release requires the recorded native RC limitations");
await writeFile(
  join(output, "LIMITATIONS.md"),
  "# Preview qualification limitations\n\n" +
    limitations +
    "\n\nThese cases remain unqualified; enabled exact-source CI gates passed.\n" +
    "\nLinux ARM64/x64 qualifies installation, resource integrity, ordinary native window and graceful quit on Ubuntu 24.04 (glibc 2.39). " +
    "System WebKitGTK 4.1, GTK 3 and Ayatana AppIndicator are required. Full Linux native feature parity remains unqualified.\n" +
    "\nUpgrade is not run on a platform until a previous different published preview exists; see each native receipt.\n",
);
console.log(
  `Assembled all three platform archives for ${manifest.tag}; native qualification remains required.`,
);
