import { test } from "node:test";
import assert from "node:assert/strict";
import { ciSelection } from "../../scripts/ci-revisions.mjs";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const head = "b".repeat(40),
  base = "a".repeat(40);
test("CI checks the PR base or push range rather than an empty Jujutsu checkout change", () => {
  assert.deepEqual(
    ciSelection({ pull_request: { base: { sha: base } } }, head),
    { base, head },
  );
  assert.deepEqual(ciSelection({ before: base }, head), { base, head });
  assert.deepEqual(ciSelection({ before: "0".repeat(40) }, head), {
    base: "root()",
    head,
  });
  assert.throws(() => ciSelection({ before: "invalid" }, head), /valid base/u);
});

test("every hosted receipt-validation job fetches ancestry and selects the real range", () => {
  const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
  for (const job of ["governance", "quality", "unit"]) {
    const block = workflow
      .split(`\n  ${job}:\n`)[1]
      ?.split(/\n  [a-z][a-z-]*:\n/u)[0];
    assert.ok(block, `${job} exists`);
    assert.match(
      block,
      /uses: actions\/checkout@v6\n\s+with:\n\s+fetch-depth: 0/u,
    );
    assert.match(block, /run: node scripts\/ci-revisions\.mjs/u);
  }
});

test("manual qualification uses its first parent even when the event has no push range", () => {
  assert.deepEqual(
    ciSelection({ inputs: { full: "true" } }, head, {
      eventName: "workflow_dispatch",
      parent: base,
    }),
    { base, head },
  );
});

test("manual qualification refuses missing, invalid or root parent history", () => {
  for (const parent of [undefined, "root()", "0".repeat(40), "invalid"])
    assert.throws(
      () => ciSelection({}, head, { eventName: "workflow_dispatch", parent }),
      /parent|ancestry/u,
    );
});

test("manual CLI exports a real source parent from a fetched colocated checkout", (context) => {
  const root = mkdtempSync(join(tmpdir(), "lapis-ci-revisions-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  const repository = join(root, "repo");
  mkdirSync(repository);
  const jj = (...args) =>
    execFileSync(
      "jj",
      [
        "--config",
        "user.name='CI fixture'",
        "--config",
        "user.email='ci-fixture@example.invalid'",
        "--config",
        "signing.behavior='drop'",
        ...args,
      ],
      { cwd: repository, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
  jj("git", "init", "--colocate", ".");
  writeFileSync(join(repository, "source.txt"), "first\n");
  jj("commit", "-m", "First source");
  const first = jj("log", "--no-graph", "-r", "@-", "-T", "commit_id").trim();
  writeFileSync(join(repository, "source.txt"), "second\n");
  jj("commit", "-m", "Second source");
  const second = jj("log", "--no-graph", "-r", "@-", "-T", "commit_id").trim();
  const event = join(root, "event.json"),
    output = join(root, "environment");
  writeFileSync(event, JSON.stringify({ inputs: { full: "true" } }));
  execFileSync(process.execPath, [resolve("scripts/ci-revisions.mjs")], {
    cwd: repository,
    env: {
      ...process.env,
      GITHUB_EVENT_NAME: "workflow_dispatch",
      GITHUB_SHA: second,
      GITHUB_EVENT_PATH: event,
      GITHUB_ENV: output,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(
    readFileSync(output, "utf8"),
    `LAPIS_DESKTOP_BASE=${first}\nLAPIS_DESKTOP_HEAD=${second}\n`,
  );
});

test("scheduled canonical main uses its fixed source SHA and fetched first parent", () => {
  const context = {
    eventName: "schedule",
    parent: base,
    repository: "lapismd/lapis-desktop",
    ref: "refs/heads/main",
  };
  assert.deepEqual(ciSelection({}, head, context), { base, head });
  for (const change of [
    { repository: "other/lapis-desktop" },
    { repository: undefined },
    { ref: "refs/heads/feature" },
    { ref: undefined },
    { parent: undefined },
    { parent: "root()" },
  ])
    assert.throws(
      () => ciSelection({}, head, { ...context, ...change }),
      /canonical|ancestry/u,
    );
});
