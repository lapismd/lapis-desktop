import type { LocalGraphCommit } from "@lapismd/jj-history";

export type WorkingCopyStatus = {
  operation: string;
  revision: string;
  changeId: string;
  workspace: string;
  description: string;
  author: LocalGraphCommit["author"];
  files: number;
  lines: { additions: number; deletions: number } | null;
  uncounted: number;
};
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid working copy status");
  return value as Record<string, unknown>;
};
const text = (value: unknown, limit: number): string => {
  if (typeof value !== "string" || value.length > limit)
    throw new Error("Invalid working copy status text");
  return value;
};
const count = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0)
    throw new Error("Invalid working copy count");
  return value;
};
const id = (value: unknown, width: number) => {
  const result = text(value, width);
  if (!new RegExp(`^[a-f0-9]{${width}}$`, "u").test(result))
    throw new Error("Invalid working copy identity");
  return result;
};
export function parseWorkingCopyStatus(frame: string): WorkingCopyStatus {
  if (frame.length > 1_048_576)
    throw new Error("Working copy status exceeds limit");
  const value = record(JSON.parse(frame));
  if (value.version !== 1) throw new Error("Unsupported working copy status");
  const commit = record(value.commit),
    author = record(commit.author);
  const timestamp = record(author.timestamp);
  const millis = text(timestamp.millis, 24);
  if (!/^-?\d+$/u.test(millis) || !Number.isFinite(Number(millis)))
    throw new Error("Invalid working copy timestamp");
  const lines = value.lines === null ? null : record(value.lines);
  const files = count(value.files),
    uncounted = count(value.uncounted);
  if (uncounted > files || uncounted > 0 !== (lines === null))
    throw new Error("Incomplete working copy totals");
  return {
    operation: id(value.operation, 128),
    revision: id(value.working_copy, 40),
    changeId: id(commit.change_id, 32),
    workspace: text(value.workspace, 256),
    description: text(commit.description, 262144),
    author: {
      name: text(author.name, 4096),
      email: text(author.email, 4096),
      timestamp: {
        millis: BigInt(millis),
        offset_minutes: Number(timestamp.offset_minutes),
      },
    },
    files,
    uncounted,
    lines: lines
      ? { additions: count(lines.additions), deletions: count(lines.deletions) }
      : null,
  };
}
