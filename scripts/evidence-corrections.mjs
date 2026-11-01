import { createHash } from "node:crypto";

/** Resolve forward provenance without rewriting or waiving an older receipt. */
export function evidenceFileCorrections(evidence, source) {
  const resolved = new Map();
  for (const entry of evidence) {
    const corrections = entry.historicalFileCorrections ?? [];
    if (!Array.isArray(corrections))
      throw new Error(`${entry.id}: invalid historical file corrections.`);
    for (const correction of corrections) {
      if (
        !correction ||
        !/^[a-f0-9]{64}$/u.test(correction.sha256 ?? "") ||
        !/^[a-f0-9]{40}$/u.test(correction.deletionRevision ?? "") ||
        !Array.isArray(correction.files) ||
        !correction.files.length
      )
        throw new Error(`${entry.id}: invalid historical file correction.`);
      const target = evidence.find((item) => item.id === correction.record);
      if (!target || !source.committed.has(target.path))
        throw new Error(`${entry.id}: correction needs a committed receipt.`);
      const hash = createHash("sha256")
        .update(source.read(target.path))
        .digest("hex");
      if (hash !== correction.sha256)
        throw new Error(`${entry.id}: corrected receipt bytes changed.`);
      if (
        !source.isAncestor(
          correction.deletionRevision,
          source.enclosing(target.path),
        )
      )
        throw new Error(`${entry.id}: deletion must be a receipt ancestor.`);
      const deleted = source.deletedFiles(correction.deletionRevision);
      const files = resolved.get(target.path) ?? new Set();
      for (const file of correction.files) {
        if (!target.files?.includes(file) || !deleted.has(file))
          throw new Error(
            `${entry.id}: correction must prove a named deletion.`,
          );
        if (files.has(file))
          throw new Error(`${entry.id}: Duplicate historical file correction.`);
        files.add(file);
      }
      resolved.set(target.path, files);
    }
  }
  return resolved;
}
