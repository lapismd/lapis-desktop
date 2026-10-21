// SPDX-License-Identifier: Apache-2.0
import { MAX_IMPORT_BYTES, MAX_IMPORT_ENTRIES } from "./import-types.ts";
import { canonicalConversationJson } from "./hashes.ts";
import { CONVERSATION_SCHEMA_VERSION, type TranscriptEntry } from "./types.ts";
import { record, assertTimestamp } from "./validation-fields.ts";
import { validateTranscriptEntry } from "./transcript-validation.ts";
import { sanitizeTranscriptEntry } from "./sanitize-entry.ts";
import {
  sanitizeDurableField,
  type DurableSanitizationOptions,
} from "./redaction.ts";
/** Read-only projection also used for provisional previews; creates no import identity. */
export function projectImportEntries(
  values: unknown[],
  sanitization: DurableSanitizationOptions = {},
): TranscriptEntry[] {
  if (
    !Array.isArray(values) ||
    values.length > MAX_IMPORT_ENTRIES ||
    new TextEncoder().encode(canonicalConversationJson(values)).length >
      MAX_IMPORT_BYTES
  )
    throw new Error("Imported preview exceeds its bounds");
  const ids = new Set<string>();
  const entries = values.map((value): TranscriptEntry => {
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
        state: e.state as Extract<TranscriptEntry, { type: "tool" }>["state"],
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
  return entries;
}
