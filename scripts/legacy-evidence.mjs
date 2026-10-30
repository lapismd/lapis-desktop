import { createHash } from "node:crypto";

// These pre-consolidation receipts arrived on the parallel CI branch. Preserve
// their original milestone-review schema only with exact source provenance.
export function legacyEvidencePaths(entries, read, original) {
  const paths = new Set();
  for (const entry of entries) {
    if (
      !/^spec\/src\/history\/E-[A-Z]+-\d{3}\.md$/u.test(entry.path) ||
      !/^[a-f0-9]{40}$/u.test(entry.revision) ||
      !/^[a-f0-9]{64}$/u.test(entry.sha256)
    )
      throw Error("Invalid legacy evidence provenance");
    const content = read(entry.path);
    if (
      createHash("sha256").update(content).digest("hex") !== entry.sha256 ||
      content !== original(entry.revision, entry.path)
    )
      throw Error(`Legacy evidence bytes changed: ${entry.path}`);
    paths.add(entry.path);
  }
  return paths;
}
