export function vaultPath(path: unknown): string {
  if (path === "/") return "";
  if (typeof path !== "string" || path.length > 4096 || /[\\\0:]/u.test(path)) {
    throw new Error("Invalid relative vault path");
  }
  if (
    path &&
    path.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    throw new Error("Invalid relative vault path");
  }
  return path;
}
