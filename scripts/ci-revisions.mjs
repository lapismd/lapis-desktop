import { readFileSync, appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const commit = (value) =>
  /^[a-f0-9]{40}$/u.test(value ?? "") && !/^0+$/u.test(value);
export function ciSelection(
  event,
  sha,
  { eventName, parent, repository, ref } = {},
) {
  if (
    eventName === "schedule" &&
    (repository !== "lapismd/lapis-desktop" || ref !== "refs/heads/main")
  )
    throw Error(
      "Scheduled CI is admitted only for canonical lapismd/lapis-desktop main",
    );
  if (!commit(sha))
    throw new Error("CI needs an explicit, valid base and head revision.");
  if (["workflow_dispatch", "schedule"].includes(eventName)) {
    if (!commit(parent))
      throw new Error(
        "Manual/scheduled CI needs fetched first-parent ancestry.",
      );
    return { base: parent, head: sha };
  }
  const requested = event.pull_request?.base?.sha ?? event.before;
  const base = requested && !/^0+$/u.test(requested) ? requested : "root()";
  if (
    !/^(?:[a-f0-9]{40}|root\(\))$/u.test(base) ||
    !/^[a-f0-9]{40}$/u.test(sha)
  )
    throw new Error("CI needs an explicit, valid base and head revision.");
  return { base, head: sha };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const sha = process.env.GITHUB_SHA;
  if (!commit(sha))
    throw new Error("CI needs an explicit, valid base and head revision.");
  const eventName = process.env.GITHUB_EVENT_NAME;
  let parent;
  if (["workflow_dispatch", "schedule"].includes(eventName)) {
    try {
      parent = execFileSync("git", ["rev-parse", "--verify", `${sha}^`], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }).trim();
    } catch (cause) {
      throw new Error(
        "Manual/scheduled CI needs fetched first-parent ancestry.",
        {
          cause,
        },
      );
    }
  }
  const selection = ciSelection(
    JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8")),
    sha,
    {
      eventName,
      parent,
      repository: process.env.GITHUB_REPOSITORY,
      ref: process.env.GITHUB_REF,
    },
  );
  appendFileSync(
    process.env.GITHUB_ENV,
    `LAPIS_DESKTOP_BASE=${selection.base}\nLAPIS_DESKTOP_HEAD=${selection.head}\n`,
  );
}
