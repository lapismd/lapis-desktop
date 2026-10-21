// SPDX-License-Identifier: Apache-2.0
import { canonicalConversationJson, sha256ConversationText } from "./hashes.ts";
import {
  validateImportSource,
  MAX_IMPORT_BYTES,
  MAX_IMPORT_ENTRIES,
  type CapturedSession,
  type SessionImportPlan,
} from "./import-types.ts";
import { normalizeConversationScope } from "./paths.ts";
import { projectImportEntries } from "./import-entries.ts";
import { type DurableSanitizationOptions } from "./redaction.ts";
import { CONVERSATION_SCHEMA_VERSION } from "./types.ts";
import { assertTimestamp, record } from "./validation-fields.ts";

/** The identity excludes contentDigest so different content claiming the same source refuses. */
export async function planSessionImport(
  capture: CapturedSession,
  scopeDir: string,
  sanitization: DurableSanitizationOptions = {},
): Promise<SessionImportPlan> {
  const c = record(structuredClone(capture), "Captured session");
  const source = structuredClone(validateImportSource(c.source));
  assertTimestamp(c, "createdAt", "Captured session");
  if (
    Object.keys(c).sort().join() !== "createdAt,entries,source,version" ||
    c.version !== 1 ||
    !Array.isArray(c.entries) ||
    !c.entries.length ||
    c.entries.length > MAX_IMPORT_ENTRIES ||
    new TextEncoder().encode(canonicalConversationJson(c)).length >
      MAX_IMPORT_BYTES
  )
    throw new Error(
      "Captured session exceeds the supported import format or bounds",
    );
  const entries = projectImportEntries(c.entries, sanitization);
  const scope = normalizeConversationScope(scopeDir);
  const key = await sha256ConversationText(
    canonicalConversationJson(["lapis-notes/session-import/v1", scope, source]),
  );
  const id = `${key.slice(0, 8)}-${key.slice(8, 12)}-4${key.slice(13, 16)}-${((parseInt(key[16]!, 16) & 3) | 8).toString(16)}${key.slice(17, 20)}-${key.slice(20, 32)}`;
  const first = entries.find((e) => e.type === "message");
  const title =
    first?.type === "message"
      ? [...first.text.replace(/\s+/gu, " ").trim()].slice(0, 80).join("")
      : `Imported ${source.kind === "opencode" ? "OpenCode" : source.kind === "cursor" ? "Cursor" : "Codex"} session`;
  const createdAt = c.createdAt as string;
  const updatedAt = entries.reduce(
    (latest, e) => (e.createdAt > latest ? e.createdAt : latest),
    createdAt,
  );
  return {
    entries,
    metadata: {
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      id,
      title,
      createdAt,
      updatedAt,
      status: "active",
      imported: {
        version: 1,
        source,
        contentDigest: await sha256ConversationText(
          canonicalConversationJson(entries),
        ),
        entryCount: entries.length,
        state: "preparing",
      },
    },
  };
}
