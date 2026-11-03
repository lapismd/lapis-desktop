import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
export const nativeOptionalInventory = JSON.parse(
  readFileSync(
    new URL("native-optional-inventory.json", import.meta.url),
    "utf8",
  ),
);

export function discoverNativeFiles(root = repositoryRoot) {
  return readdirSync(join(root, "tests/desktop"), { withFileTypes: true })
    .filter(
      (entry) =>
        (entry.isFile() || entry.isSymbolicLink()) &&
        /\.(?:test|spec)\.mjs$/u.test(entry.name),
    )
    .map((entry) => `tests/desktop/${entry.name}`)
    .sort();
}

/** Read only the dispatchers' literal test-file inventory, without starting an optional lane. */
function dispatcherFiles(root, relative) {
  return new Set(
    [
      ...readFileSync(resolve(root, relative), "utf8").matchAll(
        /"(tests\/desktop\/[a-z0-9-]+\.test\.mjs)"/gu,
      ),
    ].map((match) => match[1]),
  );
}

export function validateNativeCoverage({
  headed,
  optional = nativeOptionalInventory,
  discovered = discoverNativeFiles(),
  root = repositoryRoot,
} = {}) {
  if (
    !Array.isArray(headed) ||
    optional?.schema !== 1 ||
    !Array.isArray(optional.files) ||
    !Array.isArray(discovered) ||
    new Set(discovered).size !== discovered.length
  )
    throw Error("Invalid native scope inventory or duplicate discovered file");
  const api = dispatcherFiles(root, "scripts/desktop-api-tests.mjs");
  const live = dispatcherFiles(root, "scripts/live-provider-tests.mjs");
  const classified = new Map();
  const register = (file, scope) => {
    if (
      !/^tests\/desktop\/[a-z0-9-]+\.(?:test|spec)\.mjs$/u.test(file) ||
      classified.has(file)
    )
      throw Error(`Invalid or duplicate native scope ownership: ${file}`);
    classified.set(file, scope);
  };
  for (const { file } of headed) {
    register(file, "headed");
    if (live.has(file))
      throw Error(
        `Live provider scenario entered default native coverage: ${file}`,
      );
  }
  for (const entry of optional.files) {
    const { file, scope, owner, reason } = entry;
    register(file, scope);
    if (
      !["api", "onnx", "live-provider", "standalone-native"].includes(scope) ||
      !/^[a-z][a-z0-9-]+$/u.test(owner ?? "") ||
      typeof reason !== "string" ||
      reason.trim().length < 20
    )
      throw Error(
        `Native optional scope needs a concrete owner and reason: ${file}`,
      );
    if ((scope === "api" || scope === "onnx") && !api.has(file))
      throw Error(`Optional native API file is absent its dispatcher: ${file}`);
    if (scope === "live-provider" && !live.has(file))
      throw Error(
        `Optional live provider file is absent its dispatcher: ${file}`,
      );
    if (scope === "standalone-native" && (api.has(file) || live.has(file)))
      throw Error(
        `Standalone native scope is now collected by a dispatcher: ${file}`,
      );
    if (live.has(file) && scope !== "live-provider")
      throw Error(`Live provider scenario has the wrong scope: ${file}`);
  }
  for (const file of discovered)
    if (!classified.has(file))
      throw Error(
        `Unclassified native test file: ${file}; declare its headed family or explicit optional owner/scope`,
      );
  for (const file of classified.keys())
    if (!discovered.includes(file))
      throw Error(`Native inventory references a missing file: ${file}`);
  return {
    files: discovered.length,
    headed: headed.length,
    optional: optional.files.length,
  };
}
