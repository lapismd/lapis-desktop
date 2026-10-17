// SPDX-License-Identifier: Apache-2.0
// Retained Lapis application-tool policy; see ../NOTICE.md.
import { compileToolSchema } from "./schema/compile-tool-schema.ts";
import type {
  RegisteredAppTool,
  AppToolResult,
  AppToolJsonValue,
} from "@lapis-notes/api/agent-tools";
import { AppToolExecutionError, invalidResult } from "./app-tool-errors.ts";
const MAX_CONTENT_ITEMS = 32;
const MAX_TEXT_BYTES = 64 * 1024;
const MAX_STRUCTURED_BYTES = 64 * 1024;
const MAX_IMAGE_DATA_BYTES = 5 * 1024 * 1024;
type ValidateFunction = (value: unknown) => boolean;
export class AppToolValidation {
  readonly #validators = new Map<string, ValidateFunction>();
  delete(registrationId: string): void {
    this.#validators.delete(registrationId);
  }
  clear(): void {
    this.#validators.clear();
  }
  input(registered: RegisteredAppTool, input: unknown): void {
    let validate = this.#validators.get(registered.registrationId);
    if (!validate) {
      try {
        validate = compileToolSchema(registered.tool.inputSchema);
      } catch {
        throw new AppToolExecutionError(
          "invalid_tool_schema",
          `App tool has an invalid input schema: ${registered.tool.name}`,
        );
      }
      this.#validators.set(registered.registrationId, validate);
    }
    if (!validate(input)) {
      throw new AppToolExecutionError(
        "invalid_arguments",
        `Invalid arguments for app tool: ${registered.tool.name}`,
      );
    }
  }

  result(registered: RegisteredAppTool, result: AppToolResult): void {
    if (!result || !Array.isArray(result.content)) {
      throw invalidResult(registered.tool.name);
    }
    if (result.content.length > MAX_CONTENT_ITEMS) {
      throw invalidResult(registered.tool.name);
    }
    let textBytes = 0;
    for (const item of result.content) {
      if (item.type === "text") {
        if (typeof item.text !== "string")
          throw invalidResult(registered.tool.name);
        textBytes += byteLength(item.text);
      } else if (item.type === "image") {
        if (
          typeof item.data !== "string" ||
          typeof item.mimeType !== "string" ||
          !item.mimeType.startsWith("image/") ||
          byteLength(item.data) > MAX_IMAGE_DATA_BYTES
        ) {
          throw invalidResult(registered.tool.name);
        }
      } else {
        throw invalidResult(registered.tool.name);
      }
    }
    if (textBytes > MAX_TEXT_BYTES) throw invalidResult(registered.tool.name);
    if (result.structuredContent !== undefined) {
      let encoded: string;
      try {
        encoded = JSON.stringify(result.structuredContent);
      } catch {
        throw invalidResult(registered.tool.name);
      }
      if (byteLength(encoded) > MAX_STRUCTURED_BYTES) {
        throw invalidResult(registered.tool.name);
      }
      if (registered.tool.outputSchema) {
        let validate: ValidateFunction;
        try {
          validate = compileToolSchema(registered.tool.outputSchema);
        } catch {
          throw new AppToolExecutionError(
            "invalid_tool_schema",
            `App tool has an invalid output schema: ${registered.tool.name}`,
          );
        }
        if (!validate(result.structuredContent as AppToolJsonValue)) {
          throw invalidResult(registered.tool.name);
        }
      }
    }
  }
}
function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}
