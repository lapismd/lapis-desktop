import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, delimiter } from "node:path";
import { localSourceGroups } from "../../scripts/local-dependency-sources.mjs";

const refresh = new URL(
  "../../scripts/refresh-local-dependencies.mjs",
  import.meta.url,
);
const current = {
  name: "@lapismd/spec-validator",
  version: "0.2.1",
  engines: { node: ">=22" },
  scripts: { "build:node": "node build-fixture.mjs" },
  bin: { "spec-validator": "./dist/cli.js" },
  exports: {
    ".": { types: "./dist/index.d.ts", import: "./dist/index.js" },
    "./package.json": "./package.json",
  },
};
const publicFiles = {
  "index.js": 'export const runtime = "node";\n',
  "index.d.ts": 'export declare const runtime: "node";\n',
  "cli.js": 'console.log("Node validator fixture");\n',
};

function sourceCommand(root, ...args) {
  return execFileSync("jj", ["--no-pager", ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function fixture(context, patch = {}) {
  const root = mkdtempSync(join(tmpdir(), "lapis-validator-refresh-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, "package.json"), '{"type":"module"}');
  const desktop = join(root, "desktop"),
    bin = join(root, "bin");
  mkdirSync(desktop);
  mkdirSync(bin);
  const log = join(root, "commands.jsonl"),
    roots = {},
    dependencies = {};
  let validator;
  for (const group of localSourceGroups) {
    const source = (roots[group.repo] = join(root, group.repo));
    mkdirSync(source);
    writeFileSync(join(source, ".gitignore"), "dist/\nnode_modules/\n");
    for (const [index, directory] of group.dirs.entries()) {
      const folder = join(source, directory);
      mkdirSync(folder, { recursive: true });
      const pkg =
        group.repo === "spec-validator"
          ? { ...structuredClone(current), ...patch }
          : {
              name: `@lapismd/fixture-${group.repo}-${index}`,
              version: "1.0.0",
            };
      dependencies[pkg.name] = group.repo === "spec-validator" ? "^0.2.1" : "*";
      writeFileSync(join(folder, "package.json"), JSON.stringify(pkg));
      if (group.repo === "spec-validator") {
        validator = folder;
        writeFileSync(
          join(folder, "build-fixture.mjs"),
          `import{mkdirSync,writeFileSync}from'node:fs';mkdirSync('dist',{recursive:true});for(const[name,text]of Object.entries(${JSON.stringify(publicFiles)}))writeFileSync('dist/'+name,text);`,
        );
      }
    }
    if (group.repo === "design-core") {
      mkdirSync(join(source, "scripts"));
      writeFileSync(
        join(source, "scripts/pack-local.mjs"),
        "import{writeFileSync}from'node:fs';import{join}from'node:path';export async function packLocal(root,{outputDirectory}){const path=join(outputDirectory,'fixture.tgz');writeFileSync(path,'fixture public archive');return path;}",
      );
    }
    if (!existsSync(join(source, "package.json")))
      writeFileSync(
        join(source, "package.json"),
        JSON.stringify({
          name: `fixture-${group.repo}`,
          version: "1.0.0",
          private: true,
        }),
      );
    sourceCommand(source, "git", "init");
    sourceCommand(
      source,
      "config",
      "set",
      "--repo",
      "user.name",
      "Source fixture",
    );
    sourceCommand(
      source,
      "config",
      "set",
      "--repo",
      "user.email",
      "fixture@example.test",
    );
    sourceCommand(
      source,
      "--config",
      "signing.behavior=drop",
      "commit",
      "-m",
      "Committed public source fixture",
    );
  }
  writeFileSync(
    join(desktop, "package.json"),
    JSON.stringify({ dependencies }),
  );
  const pnpm = join(bin, "pnpm");
  writeFileSync(
    pnpm,
    `#!/usr/bin/env node
import{appendFileSync,readFileSync,writeFileSync}from'node:fs';
import{join}from'node:path';import{spawnSync}from'node:child_process';
const args=process.argv.slice(2),cwd=process.cwd();
appendFileSync(process.env.REFRESH_COMMAND_LOG,JSON.stringify({cwd,args})+'\\n');
if(args.some(a=>a.startsWith('--package=deno@'))){console.error('DENO_LAUNCH_ATTEMPT');process.exit(29);}
const pkg=JSON.parse(readFileSync('package.json'));
if(args[0]==='build:node'){
 if(!pkg.scripts?.['build:node']){console.error('Missing build:node');process.exit(42);}
 process.exit(spawnSync(process.execPath,['build-fixture.mjs'],{stdio:'inherit'}).status??1);
}
if(args.includes('pack')){
 const out=args[args.indexOf('--pack-destination')+1];
 writeFileSync(join(out,pkg.name.replace(/^@/,'').replaceAll('/','-')+'-'+pkg.version+'.tgz'),'fixture public archive');
}
`,
  );
  chmodSync(pnpm, 0o755);
  return {
    root,
    desktop,
    validator,
    log,
    run(check = false) {
      return spawnSync(
        process.execPath,
        [
          "--input-type=module",
          "-e",
          `import{refreshLocalDependencies}from${JSON.stringify(refresh.href)};await refreshLocalDependencies(${JSON.stringify(desktop)},${check});`,
        ],
        {
          env: {
            ...process.env,
            PATH: bin + delimiter + process.env.PATH,
            LAPIS_DESKTOP_SOURCE_WORKSPACES: JSON.stringify(roots),
            REFRESH_COMMAND_LOG: log,
          },
          encoding: "utf8",
        },
      );
    },
    commands() {
      return existsSync(log)
        ? readFileSync(log, "utf8").trim().split("\n").map(JSON.parse)
        : [];
    },
  };
}

test("refresh runs the supported validator Node build and retains public files without Deno", (context) => {
  const source = fixture(context);
  const result = source.run();
  assert.equal(result.status, 0, result.stderr);
  const builds = source
    .commands()
    .filter(
      ({ cwd, args }) => cwd === source.validator && args[0] === "build:node",
    );
  assert.equal(builds.length, 1);
  assert.deepEqual(builds[0].args, ["build:node"]);
  assert.equal(
    source.commands().some(({ args }) => args.some((a) => a.includes("deno@"))),
    false,
  );
  for (const [name, bytes] of Object.entries(publicFiles))
    assert.equal(
      readFileSync(join(source.validator, "dist", name), "utf8"),
      bytes,
    );
  const receipt = JSON.parse(
    readFileSync(join(source.desktop, ".local/archives/manifest.json")),
  );
  assert.equal(
    receipt.packages.find((pkg) => pkg.name === current.name)?.version,
    "0.2.1",
  );
});

for (const deno of ["2.5.6", ""]) {
  test(`refresh rejects an obsolete validator Deno engine before executing any build: ${JSON.stringify(deno)}`, (context) => {
    const source = fixture(context, { engines: { node: ">=22", deno } });
    const result = source.run();
    assert.notEqual(result.status, 0);
    assert.match(
      result.stderr,
      /Spec Validator local sources must be Deno-free/u,
    );
    assert.deepEqual(source.commands(), []);
    assert.equal(
      existsSync(join(source.desktop, ".local/archives/manifest.json")),
      false,
    );
  });
}

test("local status rejects an obsolete validator source before checking archive freshness", (context) => {
  const source = fixture(context, { engines: { node: ">=22", deno: "2.5.6" } });
  const result = source.run(true);
  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /Spec Validator local sources must be Deno-free/u,
  );
  assert.deepEqual(source.commands(), []);
});

for (const [name, patch, message] of [
  [
    "unsupported Node",
    { engines: { node: ">=999" } },
    /Spec Validator local sources require a supported Node engine/u,
  ],
  [
    "missing Node engine",
    { engines: {} },
    /Spec Validator local sources require a supported Node engine/u,
  ],
  [
    "missing Node build",
    { scripts: {} },
    /Spec Validator local sources require build:node/u,
  ],
]) {
  test(`refresh rejects ${name} before any source build`, (context) => {
    const source = fixture(context, patch);
    const result = source.run();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, message);
    assert.deepEqual(source.commands(), []);
  });
}

test("refresh keeps stale validator semver admission closed before any build", (context) => {
  const source = fixture(context, { version: "0.2.0" });
  const result = source.run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /0\.2\.0 does not satisfy \^0\.2\.1/u);
  assert.deepEqual(source.commands(), []);
});

test("refresh keeps dirty validator build inputs closed before any build", (context) => {
  const source = fixture(context);
  writeFileSync(
    join(source.validator, "build-fixture.mjs"),
    "throw Error('dirty input');\n",
  );
  const result = source.run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Uncommitted package\/build inputs/u);
  assert.deepEqual(source.commands(), []);
});
