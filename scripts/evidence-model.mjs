export function parseEvidence(source) {
  const blocks = [...source.matchAll(/```json\s*\n([\s\S]*?)\n```/gu)];
  if (blocks.length !== 1)
    throw new Error("Evidence needs exactly one JSON metadata block.");
  return JSON.parse(blocks[0][1]);
}

export function validateEvidence(
  evidence,
  requirements,
  historical = new Set(),
) {
  const errors = [];
  const ids = new Set();
  for (const record of evidence) {
    if (ids.has(record.id)) errors.push(`Duplicate evidence ID ${record.id}.`);
    ids.add(record.id);
    if (
      !/^E-[A-Z]+-\d{3}$/u.test(record.id) ||
      !["pass", "pending", "blocked", "fail"].includes(record.result)
    )
      errors.push("Invalid evidence identity or result.");
    for (const field of ["requirements", "files", "runs", "remaining"])
      if (!Array.isArray(record[field]))
        errors.push(`${record.id}: missing ${field}.`);
    if (
      !record.revision ||
      !record.versions ||
      !record.contractReview ||
      !(historical.has(record.path)
        ? record.milestoneReview || record.acceptanceReview
        : record.acceptanceReview)
    )
      errors.push(`${record.id}: missing revision, versions or reviews.`);
    for (const id of record.requirements ?? [])
      if (!requirements.has(id))
        errors.push(`${record.id}: unknown requirement ${id}.`);
    if (!record.requirements?.length)
      errors.push(`${record.id}: missing owning requirement.`);
    for (const run of record.runs ?? [])
      if (
        !run.command ||
        !run.name ||
        !["pass", "fail", "pending"].includes(run.result) ||
        !Number.isInteger(run.failures) ||
        run.failures < 0 ||
        (run.result === "pass" && run.failures !== 0)
      )
        errors.push(`${record.id}: invalid run result.`);
    if (
      record.result === "pass" &&
      (record.remaining?.length ||
        !record.runs?.some((run) => run.result === "pass"))
    )
      errors.push(`${record.id}: pass requires a passing run and no gaps.`);
  }
  return errors;
}

export function revisionErrors(evidence, current, previous, changed) {
  const errors = [];
  const historical = (file) => /^spec\/src\/history\/E-.+\.md$/u.test(file);
  for (const [file, content] of previous) {
    if (!historical(file)) continue;
    if (current.get(file) !== content)
      errors.push(`${file}: committed evidence is immutable; append a record.`);
  }
  const fresh = evidence.filter(
    (entry) => !previous.has(entry.path) && changed.includes(entry.path),
  );
  for (const file of changed.filter((file) => !historical(file)))
    if (!fresh.some((entry) => entry.files?.includes(file)))
      errors.push(`${file}: no fresh evidence coverage.`);
  return errors;
}

export function evidenceFileErrors(evidence, current, base, historicalFiles) {
  const errors = [];
  for (const entry of evidence) {
    let recorded;
    for (const file of entry.files ?? []) {
      if (current.has(file) || base.has(file)) continue;
      if (base.has(entry.path)) recorded ??= historicalFiles(entry.path);
      if (!recorded?.has(file))
        errors.push(`${entry.id}: evidence names missing file ${file}.`);
    }
  }
  return errors;
}
