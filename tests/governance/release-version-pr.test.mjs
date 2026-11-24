import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openVersionPR } from "../../scripts/release/version-pr.mjs";
const source = "a".repeat(40);
function fixture({ moved = false, unrelated = false } = {}) {
  const calls = [];
  const request = async (path, options = {}) => {
    calls.push({ path, ...options });
    if (path.endsWith("/git/ref/heads/main"))
      return { object: { sha: moved ? "c".repeat(40) : source } };
    if (path.includes("/git/ref/heads/changeset-release/"))
      return unrelated ? { object: { sha: "b".repeat(40) } } : null;
    if (path.includes("/compare/"))
      return { files: [{ filename: "src/unrelated.ts" }] };
    if (path.endsWith(`/git/commits/${source}`))
      return { tree: { sha: "base-tree" } };
    if (path.endsWith("/git/trees")) return { sha: "new-tree" };
    if (path.endsWith("/git/commits")) return { sha: "b".repeat(40) };
    if (path.endsWith("/git/refs")) return {};
    if (path.includes("/pulls?")) return [];
    if (path.endsWith("/pulls"))
      return { html_url: "https://example.invalid/pr" };
    throw Error(`Unexpected request ${path}`);
  };
  return { request, calls };
}
test("version PR binds generated file contents and consumed notes to exact main", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "desktop-version-pr-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, "package.json"), '{"version":"2026.31.6-rc.3"}\n');
  const f = fixture();
  await openVersionPR(
    source,
    ["package.json", ".changeset/note.md"],
    "2026.31.6-rc.3",
    f.request,
    root,
  );
  const tree = f.calls.find((c) => c.path.endsWith("/git/trees")).body;
  assert.equal(tree.base_tree, "base-tree");
  assert.equal(tree.tree[1].sha, null);
  assert.equal(JSON.parse(tree.tree[0].content).version, "2026.31.6-rc.3");
  assert.deepEqual(
    f.calls.find((c) => c.path.endsWith("/git/commits")).body.parents,
    [source],
  );
});
test("moved main and unrelated existing version branch cannot be overwritten", async () => {
  for (const options of [{ moved: true }, { unrelated: true }]) {
    const f = fixture(options);
    await assert.rejects(
      openVersionPR(source, ["package.json"], "2026.31.6-rc.3", f.request),
    );
    assert.equal(
      f.calls.filter((c) => c.method === "POST" || c.method === "PATCH").length,
      0,
    );
  }
});
