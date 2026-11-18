import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

/** Matching installed bytes cannot prove an archive contains its declared exports. */
export function verifyPackageArchive(archive) {
  const pkg = JSON.parse(
    execFileSync("tar", ["-xOf", archive, "package/package.json"], {
      encoding: "utf8",
    }),
  );
  const files = execFileSync("tar", ["-tzf", archive], {
    encoding: "utf8",
  }).split("\n");
  const targets = [];
  const visit = (value) => {
    if (typeof value === "string") targets.push(value);
    else if (value && typeof value === "object")
      Object.values(value).forEach(visit);
  };
  visit(pkg.exports);
  for (const key of ["types", "typings", "main", "module", "svelte", "browser"])
    if (typeof pkg[key] === "string") targets.push(pkg[key]);
  for (const target of new Set(targets)) {
    const path = target.replace(/^\.\//, "");
    assert.ok(
      path &&
        !path.startsWith("/") &&
        path.split("/").every((part) => part && part !== ".." && part !== "."),
      `${pkg.name}: unsafe public export ${target}`,
    );
    const pattern = new RegExp(
      "^package/" +
        path
          .split("*")
          .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join(".*") +
        "$",
    );
    assert.ok(
      files.some((file) => !file.endsWith("/") && pattern.test(file)),
      `${pkg.name}: missing declared public export ${target}`,
    );
  }
  return pkg;
}
