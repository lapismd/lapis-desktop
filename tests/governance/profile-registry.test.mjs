import test from "node:test";
import assert from "node:assert/strict";
test("released App Profile stays in the registry graph during private AI projection", async () => {
  const { projectUnpublished } = await import("../../scripts/ci-install.mjs");
  const projected = projectUnpublished(
    {
      dependencies: {
        "@lapis-notes/app-profile": "^0.2.0",
        "@lapismd/ai": "^0.2.0",
      },
    },
    () => true,
  );
  assert.equal(projected.dependencies["@lapis-notes/app-profile"], "^0.2.0");
});
