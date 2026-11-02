import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const sourceToolingArguments = [
  "install",
  "--frozen-lockfile",
  "--ignore-scripts",
];
export function installAiSourceTooling(source, args = sourceToolingArguments) {
  return new Promise((accept, reject) => {
    const child = spawn("pnpm", args, { cwd: source, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) return accept();
      const error = new Error(
        `AI source tooling installation exited with ${signal ?? code}`,
      );
      error.exitCode = code;
      error.signal = signal;
      reject(error);
    });
  });
}

/** The source verifier owns its TOML parser; app archives do not install its tooling. */
export async function loadAiBundleVerifier(
  source,
  install = installAiSourceTooling,
) {
  source = resolve(source);
  const verifier = join(source, "scripts/bundle.mjs");
  const require = createRequire(verifier);
  const marker = join(source, "node_modules/@iarna/toml/package.json");
  const available = () => {
    if (!existsSync(marker)) return false;
    try {
      require.resolve("@iarna/toml");
      return true;
    } catch (error) {
      if (error.code !== "MODULE_NOT_FOUND") throw error;
      return false;
    }
  };
  if (!available()) {
    await install(source, [...sourceToolingArguments]);
    // Parent/global modules are not proof that this frozen source graph exists.
    if (!available())
      throw Object.assign(
        new Error("AI source tooling installation did not provide @iarna/toml"),
        { code: "MODULE_NOT_FOUND" },
      );
  }
  return import(pathToFileURL(verifier));
}
