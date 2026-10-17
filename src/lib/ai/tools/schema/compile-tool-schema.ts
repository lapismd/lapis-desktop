// SPDX-License-Identifier: Apache-2.0
// Standard schema data attribution is in LICENSE.md and ../../NOTICE.md.
import { Validator, dereference, type Schema } from "@cfworker/json-schema";
import draft7 from "./draft7.json";

const metadata = new Validator(structuredClone(draft7) as Schema, "7", false);
const dialects = new Set([
  "http://json-schema.org/draft-07/schema#",
  "http://json-schema.org/draft-07/schema",
  "https://json-schema.org/draft-07/schema#",
  "https://json-schema.org/draft-07/schema",
]);
const annotations = [
  "__absolute_uri__",
  "__absolute_ref__",
  "__absolute_recursive_ref__",
];

export function compileToolSchema(
  schema: Record<string, unknown>,
): (value: unknown) => boolean {
  const owned = structuredClone(schema) as Schema;
  if (
    !owned ||
    typeof owned !== "object" ||
    Array.isArray(owned) ||
    !metadata.validate(owned).valid ||
    (owned.$schema !== undefined && !dialects.has(owned.$schema))
  ) {
    throw new Error("Unsupported or invalid application-tool schema");
  }
  // The public interpreter decorates its owned schema registry. Caller-supplied
  // enumerable annotations cannot replace those resolved identities.
  for (const node of Object.values(dereference(owned))) {
    if (typeof node === "boolean") continue;
    if (
      annotations.some(
        (key) => Object.getOwnPropertyDescriptor(node, key)?.enumerable,
      )
    ) {
      throw new Error("Application-tool schema contains reserved annotations");
    }
    if (node.$ref === "") node.$ref = "#";
  }
  const registry = dereference(owned);
  for (const node of Object.values(registry)) {
    if (
      typeof node !== "boolean" &&
      node.$ref !== undefined &&
      !Object.hasOwn(registry, node.__absolute_ref__ ?? node.$ref)
    ) {
      throw new Error("Application-tool schema has an unavailable reference");
    }
  }
  const validator = new Validator(owned, "7", false);
  return (value) => {
    try {
      return validator.validate(value).valid;
    } catch {
      return false;
    }
  };
}
