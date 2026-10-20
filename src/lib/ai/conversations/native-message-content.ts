// SPDX-License-Identifier: Apache-2.0; adapted from jj-store web/src/lib/collaboration/agent-message-content.ts.
import type { TranscriptItem } from "@lapismd/design-core/chat";
import type {
  NativePayload,
  NativeObservationBatch,
} from "./native-records.ts";

/** Derive known text shapes, while retaining the original payload for inspection. */
export function nativeMessageContent(
  payload: NativePayload,
  integration: NativeObservationBatch["integration"],
): {
  text: string;
  kind: "markdown" | "code";
  sentContext?: TranscriptItem["sentContext"];
} {
  if (payload.media_type === "text")
    return { text: payload.text, kind: "markdown" };
  try {
    const value: unknown = JSON.parse(payload.text);
    if (
      integration === "owned_controller" &&
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      "schema" in value &&
      value.schema === "jj-store.sent-context.v1" &&
      "text" in value &&
      typeof value.text === "string"
    ) {
      // No delivery receipt is inferred from the presence of captured context.
      let width = 3;
      for (const match of payload.text.matchAll(/`+/gu))
        width = Math.max(width, match[0].length + 1);
      const fence = "`".repeat(width);
      return {
        text: value.text,
        kind: "markdown",
        sentContext: {
          content: `${fence}json\n${payload.text}\n${fence}`,
          rawContent: payload.text,
          rawLanguage: "json",
          delivery: "unknown",
        },
      };
    }
    if (
      integration === "open_code" &&
      Array.isArray(value) &&
      value.length > 0 &&
      value.every(
        (part) =>
          part &&
          typeof part === "object" &&
          !Array.isArray(part) &&
          part.type === "text" &&
          typeof part.text === "string",
      )
    )
      return {
        text: value.map((part) => part.text).join("\n\n"),
        kind: "markdown",
      };
  } catch {
    /* Unknown JSON remains an inert exact-text code block. */
  }
  return { text: payload.text, kind: "code" };
}
