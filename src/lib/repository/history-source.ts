export type HistorySource = "backup" | "original";
export function historySource(state: Record<string, unknown>): HistorySource {
  if (state.source === undefined || state.source === "backup") return "backup";
  if (state.source === "original") return "original";
  throw new Error("Invalid repository history source");
}
export interface HistorySourcePicker {
  selected: HistorySource;
  load(): Promise<{ original: boolean }>;
  select(source: HistorySource): void;
  report(error: unknown): void;
}
