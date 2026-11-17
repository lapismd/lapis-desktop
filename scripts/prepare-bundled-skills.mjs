import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
const require = createRequire(import.meta.url);
const output = resolve("src-tauri/resources/bundled-skills.json");
const bundles = JSON.parse(
  await readFile(require.resolve("@lapis-notes/markdown/skills.json"), "utf8"),
);
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(bundles) + "\n");
