import assert from "node:assert/strict";
import { compileToolSchema } from "../../../src/lib/ai/tools/schema/compile-tool-schema.ts";
const schema = Object.freeze({
  type: "object",
  definitions: { value: { type: "string", minLength: 2 } },
  properties: { value: { $ref: "#/definitions/value" } },
  required: ["value"],
  additionalProperties: false,
});
const before = JSON.stringify(schema);
const validate = compileToolSchema(schema);
assert.equal(validate({ value: "Atlas" }), true);
assert.equal(validate({ value: "x" }), false);
assert.equal(validate({ value: "Atlas", extra: true }), false);
assert.equal(JSON.stringify(schema), before);
assert.throws(() => compileToolSchema({ type: "object", required: "value" }));
assert.throws(() =>
  compileToolSchema({
    type: "object",
    properties: { optional: { $ref: "https://missing.invalid/schema" } },
  }),
);
assert.throws(() =>
  compileToolSchema({ type: "object", __absolute_uri__: "spoofed" }),
);
console.log("CSP schema checks passed without string code generation.");
