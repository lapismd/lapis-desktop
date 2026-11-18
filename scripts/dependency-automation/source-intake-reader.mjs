import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { changesFromVcs } from "@lapismd/spec-validator";
export function sourceIntakeReader(
  root,
  execute = execFileSync,
  hasJj = existsSync(resolve(root, ".jj")),
  env = process.env,
) {
  const run = (binary, args) =>
    execute(binary, args, {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 3 * 1024 * 1024,
    });
  const fail = () => {
    throw Error("Source intake ancestry unavailable or stale");
  };
  const valid = (value) => /^[a-f0-9]{40}$/.test(value ?? "");
  const git = (args) => run("git", args).trim();
  const jj = (revision, template) =>
    run("jj", [
      "--ignore-working-copy",
      "log",
      "-r",
      revision,
      "--no-graph",
      "-T",
      template,
    ]).trim();
  const parents = (revision) =>
    jj(revision, 'parents.map(|p| p.commit_id()).join("\\n")')
      .split("\n")
      .filter(Boolean);
  const gitHead =
    !hasJj || existsSync(resolve(root, ".git"))
      ? git(["rev-parse", "--verify", "HEAD^{commit}"])
      : "";
  if ((!hasJj || gitHead) && !valid(gitHead)) fail();
  // Snapshot only this owned working copy before capturing its immutable ID.
  const current = hasJj
    ? run("jj", ["log", "-r", "@", "--no-graph", "-T", "commit_id"]).trim()
    : gitHead;
  if (!valid(current)) fail();
  const bootstrap =
    hasJj &&
    current !== gitHead &&
    parents(current)[0] === gitHead &&
    jj(current, "empty") === "true";
  const head = bootstrap ? gitHead : current;
  let base;
  if (
    env.LAPIS_DESKTOP_BASE !== undefined ||
    env.LAPIS_DESKTOP_HEAD !== undefined
  ) {
    base = env.LAPIS_DESKTOP_BASE;
    if (
      !valid(base) ||
      !valid(env.LAPIS_DESKTOP_HEAD) ||
      env.LAPIS_DESKTOP_HEAD !== head
    )
      fail();
  } else {
    base = hasJj
      ? parents(head)[0]
      : git(["rev-parse", "--verify", head + "^1"]);
  }
  if (
    !valid(base) ||
    base === head ||
    (hasJj
      ? jj(base, "commit_id")
      : git(["rev-parse", "--verify", base + "^{commit}"])) !== base
  )
    fail();
  if (hasJj) {
    if (jj(`(${base}::${head}) & ${head}`, "commit_id") !== head) fail();
  } else run("git", ["merge-base", "--is-ancestor", base, head]);
  if (!hasJj && git(["status", "--porcelain", "--untracked-files=no"])) fail();
  const read = (path) =>
    hasJj
      ? run("jj", [
          "--ignore-working-copy",
          "file",
          "show",
          "-r",
          base,
          "--",
          path,
        ])
      : run("git", ["show", `${base}:${path}`]);
  read.sourceSha = base;
  read.headSha = head;
  read.changedFiles = () =>
    changesFromVcs({ base, head }, root, (binary, args) =>
      run(binary, binary === "jj" ? ["--ignore-working-copy", ...args] : args),
    ).map((change) => change.path);
  return read;
}
