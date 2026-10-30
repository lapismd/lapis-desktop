import { accessSync, constants, realpathSync, statSync } from "node:fs";
import { delimiter, isAbsolute, join, resolve } from "node:path";

/** Capture the fixture-only tool before the actual app's PATH is hardened. */
export function fixtureJjBinary(environment = process.env) {
  const selected = environment.LAPIS_DESKTOP_FIXTURE_JJ;
  if (selected && !isAbsolute(selected))
    throw Error("The selected native fixture JJ path must be absolute");
  const candidates = selected
    ? [selected]
    : (environment.PATH ?? "")
        .split(delimiter)
        .filter(Boolean)
        .map((directory) => resolve(join(directory, "jj")));
  for (const candidate of candidates) {
    try {
      accessSync(candidate, constants.X_OK);
      if (statSync(candidate).isFile()) return realpathSync(candidate);
    } catch {
      // Try the next installed PATH entry; an explicit selection has no fallback.
    }
  }
  throw Error(
    "A selected executable JJ binary is required for native fixtures",
  );
}
