import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
it("validates schemas with JavaScript string code generation disabled", () => {
  const output = execFileSync(
    process.execPath,
    [
      "--disallow-code-generation-from-strings",
      "--import",
      "tsx",
      fileURLToPath(new URL("./schema-csp-fixture.mjs", import.meta.url)),
    ],
    { encoding: "utf8", timeout: 10_000 },
  );
  expect(output).toContain("CSP schema checks passed");
});
