import type {
  FolderPage,
  ImportHarness,
  PreviewPage,
  SessionPage,
} from "./source-port.ts";
import { validateImportRows } from "./source-port.ts";
const opaque = (v: unknown) =>
  typeof v === "string" && /^[A-Za-z0-9._:-]{1,128}$/u.test(v);
const label = (v: unknown) =>
  typeof v === "string" &&
  v.trim().length > 0 &&
  v.length <= 160 &&
  !/[\r\n\x00-\x1f]/u.test(v) &&
  !v.startsWith("/");
export function validateFolders(page: FolderPage): FolderPage {
  if (
    !page ||
    !Array.isArray(page.folders) ||
    page.folders.length > 8192 ||
    !Number.isSafeInteger(page.indexed) ||
    page.indexed < 0 ||
    page.indexed > 8192 ||
    typeof page.complete !== "boolean" ||
    typeof page.limited !== "boolean" ||
    page.folders.some(
      (f) =>
        !f ||
        !opaque(f.selector) ||
        !label(f.label) ||
        !label(f.location) ||
        !Number.isSafeInteger(f.count) ||
        f.count < 0 ||
        f.count > 8192,
    ) ||
    new Set(page.folders.map((f) => f.selector)).size !== page.folders.length
  )
    throw new Error("Invalid local session folder index");
  return structuredClone(page);
}
export function validateSessions(
  page: SessionPage,
  folder: string,
): SessionPage {
  if (
    !page ||
    !Array.isArray(page.rows) ||
    page.rows.length > 128 ||
    !Number.isSafeInteger(page.total) ||
    page.total < 0 ||
    page.total > 8192 ||
    (page.next !== null && !opaque(page.next))
  )
    throw new Error("Invalid local session page");
  validateImportRows(page.rows);
  if (
    page.rows.some(
      (r) =>
        !(["codex", "cursor", "opencode"] satisfies ImportHarness[]).includes(
          r.kind,
        ) ||
        r.folder !== folder ||
        !Number.isSafeInteger(r.bytes) ||
        r.bytes < 0 ||
        r.bytes > 64 * 1024 * 1024,
    )
  )
    throw new Error("Invalid local session folder binding");
  return structuredClone(page);
}
export function validatePreview(page: PreviewPage): PreviewPage {
  if (
    !page ||
    !opaque(page.reader) ||
    !Array.isArray(page.entries) ||
    page.entries.length > 4096 ||
    !Number.isSafeInteger(page.progress) ||
    page.progress < 0 ||
    page.progress > 100 ||
    new TextEncoder().encode(JSON.stringify(page)).length > 5 * 1024 * 1024 ||
    (page.capture !== undefined && page.progress !== 100)
  )
    throw new Error("Invalid progressive transcript preview");
  if (
    !page.capture &&
    (!Array.isArray(page.order) ||
      page.order.length > 4096 ||
      page.order.some((id) => !opaque(id)) ||
      new Set(page.order).size !== page.order.length)
  )
    throw new Error("Invalid progressive preview ordering");
  return structuredClone(page);
}
