import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const ignored = new Set([
  ".git",
  ".jj",
  "node_modules",
  "target",
  "dist",
  ".local",
  "gen",
  "book",
]);
export function repositoryFiles(root) {
  const files = [];
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (ignored.has(entry.name)) continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile())
        files.push(relative(root, path).replaceAll("\\", "/"));
      else throw new Error(`unsupported repository entry: ${path}`);
    }
  }
  visit(root);
  return files.sort();
}
export const readRepositoryFile = (root, file) =>
  readFileSync(join(root, file), "utf8");
