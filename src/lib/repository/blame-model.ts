import type { BlamePage } from "@lapismd/jj-history";
import { check } from "./history-selection.ts";
export type { BlameCommit } from "@lapismd/jj-history";
export type BlameRange = { start: number; end: number; commit_id: string };
export type BlameProgress = Omit<BlamePage, "line_count" | "ranges"> & {
  line_count: number;
  ranges: BlameRange[];
};
export type BlameSelection = {
  operation: string;
  commit: string;
  path: string;
};
export type BlameState = {
  selection?: BlameSelection;
  contents?: string;
  progress?: BlameProgress;
  status: "loading" | "ready" | "failed";
  busy: boolean;
};
/** Keep the copied presentation boundary exact even for injected host readers. */
export function validateBlame(
  page: BlamePage,
  selection: BlameSelection,
): BlameProgress {
  const line = (value: number | bigint) => {
    check(typeof value === "bigint" || Number.isSafeInteger(value));
    check(BigInt(value) >= 0n && BigInt(value) <= 32_769n);
    return Number(value);
  };
  const lineCount = line(page.line_count);
  check(
    page.operation === selection.operation &&
      page.commit === selection.commit &&
      page.path === selection.path &&
      lineCount <= 32_768 &&
      page.complete === (page.continuation === null),
  );
  let end = 1;
  const ranges = page.ranges.map((range) => ({
    ...range,
    start: line(range.start),
    end: line(range.end),
  }));
  for (const range of ranges) {
    check(
      Number.isSafeInteger(range.start) &&
        Number.isSafeInteger(range.end) &&
        range.start >= end &&
        range.end > range.start &&
        range.end <= lineCount + 1 &&
        page.commits[range.commit_id]?.id === range.commit_id,
    );
    end = range.end;
  }
  return { ...page, line_count: lineCount, ranges };
}
