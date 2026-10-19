// SPDX-License-Identifier: Apache-2.0
import type { CapturedSession } from "../conversations/import-types.ts";

/** Opaque, sanitized native selection. Neither selector nor label is a filesystem path. */
export type ImportSourceRow = {
  selector: string;
  title: string;
  profile: string;
  updatedAt: string;
};
export interface AiImportSources {
  list(signal: AbortSignal): Promise<ImportSourceRow[]>;
  preview(selector: string, signal: AbortSignal): Promise<CapturedSession>;
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
