/** Node writes this independent result beside the normal human-readable reporter. */
export default async function* nativeCounts(events) {
  let final;
  for await (const event of events) {
    if (event.type === "test:summary" && event.data.file === undefined)
      final = event.data;
  }
  if (!final) throw Error("Native Node runner did not emit its final summary");
  const { tests, passed, failed, cancelled, skipped, todo } = final.counts;
  yield JSON.stringify({
    tests,
    passed,
    failed,
    cancelled,
    skipped,
    todo,
    durationMs: final.duration_ms,
  }) + "\n";
}
