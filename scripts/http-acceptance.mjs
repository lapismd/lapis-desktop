import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { acceptanceBinary } from "./native-acceptance-binary.mjs";

export const httpAcceptancePath = ".local/native-test/http/lapis-desktop";

function selectedPath(root, environment) {
  const selected = environment.LAPIS_DESKTOP_HTTP_ACCEPTANCE_BINARY;
  if (!selected) return undefined;
  return isAbsolute(selected) ? selected : resolve(root, selected);
}

/** Build the separate development-origin e2e binary during artifact preparation. */
export async function prepareHttpAcceptanceBinary(
  execute,
  { root = process.cwd(), environment = process.env } = {},
) {
  const reused = selectedPath(root, environment);
  if (reused) return acceptanceBinary(reused);
  const configuration = JSON.parse(
    readFileSync(join(root, "src-tauri/tauri.e2e.conf.json"), "utf8"),
  );
  await execute(
    "cargo",
    [
      "build",
      "--manifest-path",
      "src-tauri/Cargo.toml",
      "--locked",
      "--features",
      "e2e",
    ],
    {
      ...environment,
      CARGO_BUILD_JOBS: "2",
      TAURI_CONFIG: JSON.stringify(configuration),
    },
  );
  const built = join(root, "src-tauri/target/debug/lapis-desktop");
  const destination = join(root, httpAcceptancePath);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(built, destination);
  chmodSync(destination, statSync(built).mode & 0o777);
  return acceptanceBinary(destination);
}
