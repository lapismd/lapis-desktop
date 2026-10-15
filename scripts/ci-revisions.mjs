import { readFileSync, appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function ciSelection(event, sha) {
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
  const selection = ciSelection(
    JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8")),
    process.env.GITHUB_SHA,
  );
  appendFileSync(
    process.env.GITHUB_ENV,
    `LAPIS_DESKTOP_BASE=${selection.base}\nLAPIS_DESKTOP_HEAD=${selection.head}\n`,
  );
}
