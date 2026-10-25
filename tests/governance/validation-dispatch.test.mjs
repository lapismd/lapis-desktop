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

test("nested aggregate builds get a bounded heap only at build dispatch", async (context) => {
  const directory = await mkdtemp(join(tmpdir(), "desktop-build-dispatch-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(join(directory, "scripts/validation"), { recursive: true });
  await mkdir(join(directory, "node_modules/.bin"), { recursive: true });
  await writeFile(
    join(directory, "scripts/validation/lanes.json"),
    JSON.stringify({
      "check:all": "validation-probe aggregate && validation-build",
      build: "validation-probe build",
      test: "validation-probe test",
    }),
  );
  await writeFile(
    join(directory, "node_modules/.bin/validation-probe"),
    "#!/usr/bin/env node\nrequire('node:fs').appendFileSync('heap.jsonl', JSON.stringify({stage:process.argv[2],options:process.env.NODE_OPTIONS}) + '\\n');\n",
    { mode: 0o755 },
  );
  await writeFile(
    join(directory, "node_modules/.bin/validation-build"),
    `#!/usr/bin/env node\nprocess.constrainedMemory=()=>8*1024**3;import(${JSON.stringify(new URL("../../scripts/validation.mjs", import.meta.url).href)}).then(({runNative})=>runNative('build',[],process.cwd()));\n`,
    { mode: 0o755 },
  );
  const originalWorker = process.env.LAPIS_DESKTOP_VALIDATION_WORKER,
    originalOptions = process.env.NODE_OPTIONS,
    originalMemory = process.constrainedMemory;
  try {
    process.env.LAPIS_DESKTOP_VALIDATION_WORKER = "1";
    process.env.NODE_OPTIONS = "--stack-trace-limit=31";
    process.constrainedMemory = () => 8 * 1024 ** 3;
    await runNative("check:all", [], directory);
    await runNative("test", [], directory);
    delete process.env.LAPIS_DESKTOP_VALIDATION_WORKER;
    await runNative("build", [], directory);
    assert.deepEqual(
      (await readFile(join(directory, "heap.jsonl"), "utf8"))
        .trim()
        .split("\n")
        .map(JSON.parse),
      [
        { stage: "aggregate", options: "--stack-trace-limit=31" },
        { stage: "build", options: "--max-old-space-size=4096" },
        { stage: "test", options: "--stack-trace-limit=31" },
        { stage: "build", options: "--stack-trace-limit=31" },
      ],
    );
  } finally {
    process.constrainedMemory = originalMemory;
    for (const [key, value] of [
      ["LAPIS_DESKTOP_VALIDATION_WORKER", originalWorker],
      ["NODE_OPTIONS", originalOptions],
    ])
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
  }
});
