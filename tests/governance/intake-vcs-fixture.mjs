import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { gunzipSync } from "node:zlib";
import { validatorFacts } from "../../scripts/dependency-automation/check-canonical-intake.mjs";

export const notePath = ".changeset/lapis-dependencies-f235813775ce.md";
export const emptyNote =
  "---\n---\n\nRefresh first-party Lapis dependencies to the published versions recorded in this pull request.\n";
const policyPath = ".github/dependency-automation/canonical-intake.json";
const policyBytes = readFileSync(
  new URL("../../" + policyPath, import.meta.url),
  "utf8",
);
const { chapters } = JSON.parse(policyBytes);
const fixture = JSON.parse(
  gunzipSync(
    readFileSync(
      new URL("../fixtures/desktop-validator-intake.json.gz", import.meta.url),
    ),
  ),
);
export const guardPath = resolve(
  import.meta.dirname,
  "../../scripts/dependency-automation/check-canonical-intake.mjs",
);
const document = (facts) =>
  "# Source\n\n<!-- dependency-intake:validator-development:start -->\n\n```json\n" +
  JSON.stringify(facts, null, 2) +
  "\n```\n\n<!-- dependency-intake:validator-development:end -->\n";

export function intakeVcsFixture({
  note = emptyNote,
  extra = false,
  mode = "git",
} = {}) {
  const directory = mkdtempSync(join(tmpdir(), "desktop-intake-vcs-"));
  const root = join(directory, "source");
  mkdirSync(root);
  const jj = (args) =>
    execFileSync(
      "jj",
      [
        "--config",
        'user.name="Validation"',
        "--config",
        'user.email="validation@localhost"',
        "--config",
        'signing.behavior="drop"',
        ...args,
      ],
      { cwd: root, encoding: "utf8", stdio: "pipe" },
    ).trim();
  const write = (path, text) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  jj([
    "git",
    "init",
    mode === "jj-internal" ? "--no-colocate" : "--colocate",
    root,
  ]);
  write(".gitignore", "node_modules/\n.local/\n");
  write(policyPath, policyBytes);
  for (const path of [
    "scripts/ci-sources.json",
    ".github/ci-docs/package.json",
    ".github/dependency-automation/artifact-projection.json",
  ])
    write(
      path,
      readFileSync(new URL("../../" + path, import.meta.url), "utf8"),
    );
  const apply = (files) => {
    for (const [path, text] of Object.entries(files)) write(path, text);
    for (const path of chapters)
      write(path, document(validatorFacts(files, policyBytes)));
  };
  apply(fixture.before);
  jj(["commit", "-m", "Real released SDK baseline"]);
  const base = jj(["log", "-r", "@-", "--no-graph", "-T", "commit_id"]);
  apply(fixture.after);
  write(notePath, note);
  if (extra) write("src/unrelated.ts", "export const unrelated = true;\n");
  jj(["commit", "-m", "Real released SDK candidate with managed note"]);
  let head = jj(["log", "-r", "@-", "--no-graph", "-T", "commit_id"]);
  if (mode === "jj-working") {
    jj(["new", base, "-m", "Local working SDK candidate"]);
    apply(fixture.after);
    write(notePath, note);
    if (extra) write("src/unrelated.ts", "export const unrelated = true;\n");
    head = jj(["log", "-r", "@", "--no-graph", "-T", "commit_id"]);
  }
  if (mode === "jj-selected" || mode === "jj-internal")
    jj(["--ignore-immutable", "edit", head]);
  if (mode === "git" || mode === "jj-bootstrap") {
    renameSync(join(root, ".jj"), join(directory, "saved-jj"));
    if (mode === "jj-bootstrap") jj(["git", "init", "--colocate", root]);
  }
  const env = { ...process.env };
  delete env.LAPIS_DESKTOP_BASE;
  delete env.LAPIS_DESKTOP_HEAD;
  return {
    directory,
    root,
    base,
    head,
    jj,
    write,
    cli(overrides = {}) {
      return spawnSync(process.execPath, [guardPath], {
        cwd: root,
        env: { ...env, ...overrides },
        encoding: "utf8",
        maxBuffer: 4 * 1024 * 1024,
      });
    },
  };
}
