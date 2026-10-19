import type { HistorySearchHit } from "./search.ts";

export type HistoryExpression =
  | { type: "term"; field: string | null; value: string }
  | { type: "and" | "or"; clauses: HistoryExpression[] }
  | { type: "not"; operand: HistoryExpression };
export type HistoryIndexStatus = {
  generation: number;
  indexed: number;
  omitted: number;
  complete: boolean;
};
export type IndexedHistoryHit = {
  record: {
    revision: HistorySearchHit["revision"];
    parents: string[];
    path: string | null;
    content_id: string | null;
    deleted: boolean;
    previous: string | null;
    unavailable: boolean;
  };
  excerpt: string;
  line: number | null;
};
export type IndexedHistoryPage = {
  status: HistoryIndexStatus;
  hits: IndexedHistoryHit[];
  next: string | null;
  reset: boolean;
};
export type HistoryMatchContext = {
  text: string;
  start: number;
  end: number;
  before: boolean;
  after: boolean;
};
export interface IndexedHistoryService {
  step(): Promise<HistoryIndexStatus>;
  query(request: {
    expression: HistoryExpression;
    case_sensitive: boolean;
    cursor: string | null;
    limit: number;
  }): Promise<IndexedHistoryPage>;
  context(request: {
    commit: string;
    path: string;
    start: number;
    end: number;
  }): Promise<HistoryMatchContext>;
}
