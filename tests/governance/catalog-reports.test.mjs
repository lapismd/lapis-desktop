import test from "node:test";
import assert from "node:assert/strict";
import { catalogArguments } from "../../scripts/validation/catalog.mjs";

test("catalog reports retain every theme and viewport with literal targets", () => {
  const args = [
    "catalog/space story.stories.ts",
    "--shard=1/4",
    "--outputFile=reports/test.xml",
  ];
  const reports = new Set();
  for (const viewport of ["desktop", "narrow"])
    for (const theme of ["light", "dark"]) {
      const actual = catalogArguments(args, viewport, theme);
      assert.deepEqual(actual.slice(0, 2), args.slice(0, 2));
      reports.add(actual[2]);
    }
  assert.equal(reports.size, 4);
  assert.equal(args[2], "--outputFile=reports/test.xml");
  assert.deepEqual(
    catalogArguments(
      ["--outputFile.junit", "reports/test.xml"],
      "desktop",
      "dark",
    ),
    ["--outputFile.junit", "reports/test-desktop-dark.xml"],
  );
  assert.deepEqual(
    catalogArguments(["--outputFile", "reports/result"], "narrow", "light"),
    ["--outputFile", "reports/result-narrow-light"],
  );
});
