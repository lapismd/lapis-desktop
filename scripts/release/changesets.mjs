import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
export const changesetBin = fileURLToPath(
  new URL(
    "../release-tools/node_modules/@changesets/cli/bin.js",
    import.meta.url,
  ),
);
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  execFileSync(process.execPath, [changesetBin, ...process.argv.slice(2)], {
    stdio: "inherit",
  });
