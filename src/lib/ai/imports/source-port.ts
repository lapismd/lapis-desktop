// SPDX-License-Identifier: Apache-2.0
import type { CapturedSession } from "../conversations/import-types.ts";

/** Opaque, sanitized native selection. Neither selector nor label is a filesystem path. */
export type ImportSourceRow = {
  selector: string;
  title: string;
  profile: string;
  updatedAt: string;
};
export type ImportHarness = "codex" | "cursor" | "opencode";
export type ImportFolder = {
  selector: string;
  label: string;
  location: string;
  count: number;
};
export type FolderPage = {
  folders: ImportFolder[];
  indexed: number;
  complete: boolean;
  limited: boolean;
};
export type BrowserSession = ImportSourceRow & {
  kind: ImportHarness;
  folder: string;
  bytes: number;
};
export type SessionPage = {
  rows: BrowserSession[];
  next: string | null;
  total: number;
};
export type PreviewPage = {
  reader: string;
  entries: CapturedSession["entries"];
  /** Delta entries plus the complete portable ordering while provisional. */
  order?: string[];
  progress: number;
  capture?: CapturedSession;
};
export interface AiImportSources {
  folders(
    harness: ImportHarness,
    refresh: boolean,
    signal: AbortSignal,
  ): Promise<FolderPage>;
  sessions(
    folder: string,
    after: string | undefined,
    signal: AbortSignal,
  ): Promise<SessionPage>;
  startPreview(selector: string, signal: AbortSignal): Promise<PreviewPage>;
  nextPreview(reader: string, signal: AbortSignal): Promise<PreviewPage>;
  releasePreview(reader: string, signal: AbortSignal): Promise<void>;
}
export function validateImportRows(rows: ImportSourceRow[]): ImportSourceRow[] {
  if (
    !Array.isArray(rows) ||
    rows.length > 256 ||
    rows.some(
      (r) =>
        !r ||
        typeof r.selector !== "string" ||
        !/^[A-Za-z0-9._:-]{1,128}$/u.test(r.selector) ||
        typeof r.title !== "string" ||
        !r.title.trim() ||
        r.title.length > 160 ||
        /[\r\n]/u.test(r.title) ||
        typeof r.profile !== "string" ||
        !r.profile.trim() ||
        r.profile.length > 80 ||
        /[\r\n]/u.test(r.profile) ||
        typeof r.updatedAt !== "string" ||
        !Number.isFinite(Date.parse(r.updatedAt)),
    )
  )
    throw new Error("Import source list is invalid or exceeds its bound");
  if (new Set(rows.map((r) => r.selector)).size !== rows.length)
    throw new Error("Import source selectors must be distinct");
  return structuredClone(rows);
}
