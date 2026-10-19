// Adapted from jj-store/scripts/lapis-ai.mjs and agent-runtime-resources.mjs.
import { spawn } from "node:child_process";
import { cp, mkdir, readFile, rename, rm, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "../lapis-ai");
const destination = join(root, "src-tauri/resources/lapis-ai");
const { verifyBundle } = await import(
  pathToFileURL(join(source, "scripts/bundle.mjs"))
);
const { values } = parseArgs({
  args: process.argv.slice(2).filter((arg) => arg !== "--"),
  options: { bundle: { type: "string" }, reuse: { type: "boolean" } },
});
async function run(args) {
  await new Promise((accept, reject) => {
    const child = spawn("pnpm", args, { cwd: source, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0 ? accept() : reject(Error(`AI preparation exited ${code}`)),
    );
  });
}
if (values.reuse) {
  try {
    await stat(destination);
    await verifyBundle(destination);
    console.log(`Verified staged AI runtime at ${destination}`);
    process.exit(0);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
const temporary = join(source, "dist", `desktop-${process.pid}`);
const candidate = `${destination}.pending-${process.pid}`;
const backup = `${destination}.previous-${process.pid}`;
const bundle = values.bundle ? resolve(values.bundle) : temporary;
try {
  if (!values.bundle) {
    await run([
      "dev:cargo",
      "--",
      "build",
      "-p",
      "lapis-acp",
      "-p",
      "lapis-agent",
      "-p",
      "lapis-agent-tools",
      "-p",
      "lapis-compute",
      "--locked",
    ]);
    await run([
      "package:stage",
      "--",
      "--profile",
      "debug",
      "--destination",
      temporary,
    ]);
  }
  await verifyBundle(bundle);
  await mkdir(resolve(destination, ".."), { recursive: true });
  await cp(bundle, candidate, { recursive: true });
  await verifyBundle(candidate);
  const sourcePackage = JSON.parse(
    await readFile(join(source, "package.json"), "utf8"),
  );
  await stat(candidate);
  let retained = false;
  try {
    await rename(destination, backup);
    retained = true;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  try {
    await rename(candidate, destination);
  } catch (error) {
    if (retained) await rename(backup, destination);
    throw error;
  }
  if (retained) await rm(backup, { recursive: true });
  console.log(
    `Prepared verified Lapis AI ${sourcePackage.version} at ${destination}`,
  );
} finally {
  await rm(candidate, { recursive: true, force: true });
  if (!values.bundle) await rm(temporary, { recursive: true, force: true });
}
