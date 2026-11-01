import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

/** Unpack a Tasks pin. The published registry copy is a separate install. */
export function unpackTasksPackage(tarball, destination) {
  rmSync(destination, { recursive: true, force: true });
  mkdirSync(destination, { recursive: true });
  execFileSync("tar", ["-xzf", tarball, "-C", destination]);
  return join(destination, "package");
}
