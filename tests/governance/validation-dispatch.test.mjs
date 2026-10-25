import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runNative } from "../../scripts/validation.mjs";

async function dispatch(context, lane, args) {
  const directory = await mkdtemp(
    join(tmpdir(), "desktop-validation-dispatch-"),
  );
  context.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(join(directory, "scripts/validation"), { recursive: true });
  await mkdir(join(directory, "node_modules/.bin"), { recursive: true });
  await writeFile(
    join(directory, "scripts/validation/lanes.json"),
    JSON.stringify({ [lane]: "validation-probe" }),
  );
  await writeFile(
    join(directory, "node_modules/.bin/validation-probe"),
    "#!/usr/bin/env node\nrequire('node:fs').appendFileSync('calls.jsonl', JSON.stringify(process.argv.slice(2)) + '\\n');\n",
    { mode: 0o755 },
  );
  await runNative(lane, args, directory);
  return (await readFile(join(directory, "calls.jsonl"), "utf8"))
    .trim()
    .split("\n")
    .map(JSON.parse);
}

test("nested native catalog dispatch preserves the bounded complete-suite policy", async (context) => {
  assert.deepEqual(
    await dispatch(context, "test:storybook", []),
    Array.from({ length: 4 }, (_, index) => [`--shard=${index + 1}/4`]),
  );
});

test("an outer-worker shard and explicit story selection each execute once", async (context) => {
  for (const args of [
    ["--shard=2/4"],
    ["Example.stories.ts", "-t", "Space ; literal"],
  ])
    assert.deepEqual(await dispatch(context, "test:storybook", args), [args]);
});

test("noncatalog nested lanes execute once with their exact literal arguments", async (context) => {
  const args = ["two words", "; echo remains literal"];
  assert.deepEqual(await dispatch(context, "probe", args), [args]);
});
