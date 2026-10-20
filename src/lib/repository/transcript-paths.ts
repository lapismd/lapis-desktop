// Mirror the native portable-content boundary; native admission stays authoritative.
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
export function transcriptFile(path: string): boolean {
  const parts = path.split("/");
  const index = parts.indexOf(".lapis");
  const tail = parts.slice(index + 1);
  return (
    index >= 0 &&
    parts.every((p) => !["", ".", "..", ".git", ".jj"].includes(p)) &&
    tail.length === 4 &&
    tail[0] === "agents" &&
    tail[1] === "sessions" &&
    UUID.test(tail[2]!) &&
    ["metadata.yaml", "agents.jsonl", "transcript.jsonl"].includes(tail[3]!)
  );
}
export function portableBackupFile(path: string): boolean {
  return !path.split("/").includes(".lapis") || transcriptFile(path);
}
