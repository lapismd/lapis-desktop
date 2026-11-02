import { readFileSync, appendFileSync } from "node:fs";

export function nativeBuildEnvironment(
  environment = process.env,
  platform = process.platform,
) {
  const configuration = JSON.parse(
    readFileSync(
      new URL("../src-tauri/tauri.conf.json", import.meta.url),
      "utf8",
    ),
  );
  const minimum = configuration.bundle.macOS.minimumSystemVersion;
  if (!/^\d+\.\d+(?:\.\d+)?$/.test(minimum))
    throw Error("Invalid macOS deployment minimum");
  if (platform !== "darwin") return { ...environment };
  if (
    environment.MACOSX_DEPLOYMENT_TARGET &&
    environment.MACOSX_DEPLOYMENT_TARGET !== minimum
  )
    throw Error(
      `MACOSX_DEPLOYMENT_TARGET must match configured minimum ${minimum}`,
    );
  return { ...environment, MACOSX_DEPLOYMENT_TARGET: minimum };
}

if (process.argv.includes("--github-env")) {
  const environment = nativeBuildEnvironment();
  if (process.platform === "darwin")
    appendFileSync(
      process.env.GITHUB_ENV,
      `MACOSX_DEPLOYMENT_TARGET=${environment.MACOSX_DEPLOYMENT_TARGET}\n`,
    );
}
