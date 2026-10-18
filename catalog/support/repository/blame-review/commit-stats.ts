import { revision, parent } from "../fixture.ts";
import { largeCommitStats } from "./large-fixture.ts";

/** Presentation fixture only. Blame's native summary does not contain diff stats. */
export const reviewCommitStats: Record<
  string,
  { additions: number; deletions: number }
> = {
  [revision]: { additions: 22, deletions: 15 },
  [parent]: { additions: 4, deletions: 0 },
  ...largeCommitStats,
};
