import { readFileSync } from "node:fs";

export function acceptanceBinary(path) {
  const bytes = readFileSync(path);
  for (const marker of [
    "TAURI_WEBDRIVER_PORT",
    "LAPIS_DESKTOP_ACCEPTANCE_ROOT",
  ]) {
    if (!bytes.includes(Buffer.from(marker)))
      throw new Error(
        `Refusing a normal native build for acceptance: missing ${marker}. Build the e2e feature first.`,
      );
  }
  return path;
}
