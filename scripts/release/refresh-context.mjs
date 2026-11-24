import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  projectionSourceInputs,
  computeArtifactProjectionShape,
  verifyArtifactProjection,
} from "../dependency-automation/artifact-projection.mjs";

/** Renew the exact context during reviewed application versioning, never SDK intake. */
export function refreshReleaseContext(root = process.cwd()) {
  const path = ".github/dependency-automation/artifact-projection.json";
  const files = Object.fromEntries(
    projectionSourceInputs.map((p) => [p, readFileSync(join(root, p), "utf8")]),
  );
  const descriptor = JSON.parse(readFileSync(join(root, path), "utf8"));
  descriptor.immutableShapeSha256 = computeArtifactProjectionShape(files);
  const descriptorBytes = JSON.stringify(descriptor, null, 2) + "\n";
  // All strict descriptor, SDK-shape and immutability checks remain active.
  const receipt = verifyArtifactProjection({ files, descriptorBytes });
  writeFileSync(join(root, path), descriptorBytes);
  return { path, ...receipt };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  console.log(refreshReleaseContext());
