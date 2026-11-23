import test from "node:test";
import assert from "node:assert/strict";
import { requireReleaseIntent } from "../../scripts/release/check-intent.mjs";
test("product changes cannot silently skip preview release intent", () => {
  assert.throws(
    () => requireReleaseIntent(["src/lib/native/client.ts"]),
    /new Changeset/,
  );
  assert.throws(
    () =>
      requireReleaseIntent(["src-tauri/Cargo.toml", ".changeset/README.md"]),
    /new Changeset/,
  );
  assert.throws(
    () =>
      requireReleaseIntent([
        "src/product.ts",
        ".changeset/lapis-dependencies-012345abcdef.md",
      ]),
    /new Changeset/,
  );
  assert.doesNotThrow(() =>
    requireReleaseIntent(["src/App.svelte", ".changeset/new-feature.md"]),
  );
  assert.doesNotThrow(() => requireReleaseIntent(["docs/desktop-release.md"]));
  assert.doesNotThrow(() =>
    requireReleaseIntent(["src-tauri/Cargo.toml", "package.json"], {
      versionChange: true,
    }),
  );
});
