import {
  sanitizeDurableField,
  type DurableSanitizationOptions,
} from "./redaction.ts";
import type { TranscriptEntry } from "./types.ts";
export function sanitizeTranscriptEntry(
  entry: TranscriptEntry,
  sanitization: DurableSanitizationOptions,
): TranscriptEntry {
  if (entry.type === "tool") {
    const input = sanitizeDurableField(entry.input, sanitization);
    const output = sanitizeDurableField(entry.output, sanitization);
    return {
      ...entry,
      input: input.text,
      output: output.text,
      redacted:
        entry.redacted || input.redacted || output.redacted || undefined,
      truncated:
        entry.truncated || input.truncated || output.truncated || undefined,
    };
  }
  if (entry.type === "approval.request" && entry.tool?.input) {
    const input = sanitizeDurableField(entry.tool.input, sanitization);
    return {
      ...entry,
      tool: { ...entry.tool, input: input.text },
      redacted: entry.redacted || input.redacted || undefined,
      truncated: entry.truncated || input.truncated || undefined,
    };
  }
  if (entry.type === "error") {
    return {
      ...entry,
      message: sanitizeDurableField(entry.message, sanitization).text ?? "",
    };
  }
  return entry;
}
