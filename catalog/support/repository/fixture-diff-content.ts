export function fixtureDiffContent(scenario: string) {
  if (scenario === "binary")
    return { status: "unavailable" as const, reason: "binary" as const };
  const before =
    scenario === "transcripts"
      ? '{"type":"message","role":"user","text":"Review my notes"}\n'
      : "# Notes\nOld title\n";
  const after =
    scenario === "transcripts"
      ? before +
        '{"type":"message","role":"assistant","text":"Your local conversation is backed up."}\n'
      : "# Notes\nHistory is retained\n";
  return {
    status: "text" as const,
    hunks: [
      {
        kind: "different" as const,
        before_start: 0,
        after_start: 0,
        before,
        after,
      },
    ],
  };
}
