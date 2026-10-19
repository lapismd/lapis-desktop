export type HistorySearchQuery = {
  text: string;
  path?: string;
  author?: string;
  from_millis?: number;
  to_millis?: number;
};
export type HistorySearchCursor = {
  anchor: string;
  revision: number;
  after_path?: string | null;
};
export type HistorySearchHit = {
  revision: {
    checkpoint: {
      operation: string;
      commit: string;
      change_id: string;
      description: string;
      timestamp_millis: number;
    };
    author: string;
    email: string;
  };
  path?: string | null;
  line?: number | null;
  excerpt: string;
};
export type HistorySearchPage = {
  hits: HistorySearchHit[];
  next?: HistorySearchCursor | null;
  checkpoints: number;
  unindexed: number;
};
export interface HistorySearchService {
  page(request: {
    query: HistorySearchQuery;
    cursor?: HistorySearchCursor | null;
  }): Promise<HistorySearchPage>;
}
export type HistorySearchState = {
  busy: boolean;
  phase: "ready" | "searching";
  searched: boolean;
  hits: HistorySearchHit[];
  next?: HistorySearchCursor | null;
  checkpoints: number;
  unindexed: number;
};
export const initialSearchState = (): HistorySearchState => ({
  busy: false,
  phase: "ready",
  searched: false,
  hits: [],
  checkpoints: 0,
  unindexed: 0,
});
