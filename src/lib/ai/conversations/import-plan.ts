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
import { sanitizeTranscriptEntry } from "./sanitize-entry.ts";
import {
  sanitizeDurableField,
  type DurableSanitizationOptions,
} from "./redaction.ts";
import { CONVERSATION_SCHEMA_VERSION, type TranscriptEntry } from "./types.ts";
import { validateTranscriptEntry } from "./transcript-validation.ts";
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
  const ids = new Set<string>();
  const entries = c.entries.map((value): TranscriptEntry => {
    const e = record(value, "Captured entry");
    if (
      typeof e.id !== "string" ||
      !/^[A-Za-z0-9._:-]{1,128}$/u.test(e.id) ||
      ids.has(e.id)
    )
      throw new Error(
        "Captured source event identities must be distinct and portable",
      );
    ids.add(e.id);
    assertTimestamp(e, "createdAt", "Captured entry");
    const base = {
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      id: `import:${e.id}`,
      createdAt: e.createdAt as string,
    };
    let entry: TranscriptEntry;
    if (e.type === "message") {
      if (Object.keys(e).sort().join() !== "createdAt,id,role,text,type")
        throw new Error("Unsupported imported message fields");
      entry = {
        ...base,
        type: "message",
        role: e.role as "user" | "assistant",
        text: e.text as string,
      };
    } else if (e.type === "tool") {
      if (
        Object.keys(e).some(
          (k) =>
            ![
              "createdAt",
              "id",
              "type",
              "name",
              "state",
              "input",
              "output",
            ].includes(k),
        )
      )
        throw new Error("Unsupported imported tool fields");
      entry = {
        ...base,
        type: "tool",
        toolId: base.id,
        name: e.name as string,
        state: e.state as "completed",
        ...(e.input !== undefined ? { input: e.input as string } : {}),
        ...(e.output !== undefined ? { output: e.output as string } : {}),
      };
    } else if (e.type === "notice") {
      if (Object.keys(e).sort().join() !== "createdAt,id,text,type")
        throw new Error("Unsupported imported notice fields");
      entry = { ...base, type: "system.notice", text: e.text as string };
    } else
      throw new Error(
        "Import cannot retain executable or permission authority",
      );
    entry.provenance = {
      originClass: "untrusted",
      sourceKind:
        entry.type === "message"
          ? entry.role === "user"
            ? "user-message"
            : "assistant-message"
          : "runtime-output",
    };
    validateTranscriptEntry(entry);
    if (entry.type === "message" || entry.type === "system.notice")
      entry.text = sanitizeDurableField(entry.text, sanitization).text ?? "";
    if (entry.type === "tool")
      entry.name = sanitizeDurableField(entry.name, sanitization).text ?? "";
    return validateTranscriptEntry(
      sanitizeTranscriptEntry(validateTranscriptEntry(entry), sanitization),
    );
  });
  const scope = normalizeConversationScope(scopeDir);
  const key = await sha256ConversationText(
    canonicalConversationJson(["lapis-notes/session-import/v1", scope, source]),
  );
  const id = `${key.slice(0, 8)}-${key.slice(8, 12)}-4${key.slice(13, 16)}-${((parseInt(key[16]!, 16) & 3) | 8).toString(16)}${key.slice(17, 20)}-${key.slice(20, 32)}`;
  const first = entries.find((e) => e.type === "message");
  const title =
    first?.type === "message"
      ? [...first.text.replace(/\s+/gu, " ").trim()].slice(0, 80).join("")
      : "Imported Codex session";
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
