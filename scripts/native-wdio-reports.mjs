import assert from "node:assert/strict";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** WebdriverIO may report the configured spec as a path or a file URL. */
export function nativeWdioSpecPath(spec) {
  assert.ok(typeof spec === "string" || spec instanceof URL);
  if (spec instanceof URL || spec.startsWith("file:"))
    return fileURLToPath(spec);
  return resolve(spec);
}
