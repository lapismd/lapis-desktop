import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { catalogProfile } from "./catalog-profile.mjs";

/** Pass the selected CI shard into the public catalog lane before dispatch. */
export function ciCatalogArguments(environment = process.env) {
  const shard = environment.LAPIS_DESKTOP_CATALOG_SHARD;
  const profile = environment.LAPIS_DESKTOP_CATALOG_PROFILE;
  if (profile !== undefined) catalogProfile(profile);
  const args = profile === undefined ? [] : [`--profile=${profile}`];
  if (shard === undefined)
    return ["test:storybook", ...(args.length ? ["--", ...args] : [])];
  if (!/^[1-4]$/.test(shard))
    throw new Error(
      "LAPIS_DESKTOP_CATALOG_SHARD must select one of four shards",
    );
  return ["test:storybook", "--", `--shard=${shard}/4`, ...args];
}

async function main() {
  const child = spawn("pnpm", ciCatalogArguments(), {
    env: process.env,
    stdio: "inherit",
  });
  const stop = () => child.kill("SIGTERM");
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  try {
    process.exitCode = await new Promise((accept, reject) => {
      child.once("error", reject);
      child.once("exit", (code) => accept(code ?? 1));
    });
  } finally {
    process.removeListener("SIGINT", stop);
    process.removeListener("SIGTERM", stop);
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
