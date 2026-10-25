import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { root, localRoot, json } from "./paths.mjs";
import { cacheKeys, hash, label } from "./model.mjs";
import { snapshotFile } from "./source.mjs";
import { dockerOutput } from "./docker.mjs";

/** Adoption is permitted only for this exact old input key and owned volumes. */
export async function cacheSpecifications(config, workspace, source, selected) {
  const keys = cacheKeys({
    image: selected.id,
    lock: hash(snapshotFile(root, source.revision, "pnpm-lock.yaml")),
    nativeLock:
      selected.target === "full"
        ? hash(snapshotFile(root, source.revision, "src-tauri/Cargo.lock"))
        : "",
    archives: JSON.stringify(source.archives),
    nativeSources: JSON.stringify(source.nativeSources),
  });
  const prefix = `lapis-desktop-validation-${workspace}-`;
  const entries = [[`${prefix}${keys.javascript}-pnpm`, "/cache/pnpm"]];
  if (selected.target !== "full") return entries;
  const path = join(localRoot, "native-cache-migrations.json");
  const migrations = await json(path, {});
  let adopted = migrations[keys.native];
  const exists = (name) => {
    try {
      const owner = dockerOutput(config, [
        "volume",
        "inspect",
        name,
        "--format",
        `{{index .Labels "${label}"}}`,
      ]);
      if (owner !== "cache") throw Error("Refusing unowned native cache");
      return true;
    } catch (error) {
      if (error.message.includes("unowned")) throw error;
      return false;
    }
  };
  if (
    adopted &&
    (!/^[a-f0-9]{20}$/.test(adopted.key) ||
      adopted.workspace !== workspace ||
      adopted.nativeKey !== keys.native)
  )
    throw Error("Invalid native cache migration");
  if (adopted) {
    for (const kind of ["cargo", "rust"])
      if (!exists(`${prefix}${adopted.key}-${kind}`))
        throw Error(
          "Adopted native cache is missing; inspect its migration receipt",
        );
  } else if (
    ["cargo", "rust"].every((kind) => exists(`${prefix}${keys.legacy}-${kind}`))
  ) {
    adopted = { key: keys.legacy, workspace, nativeKey: keys.native };
    migrations[keys.native] = adopted;
    await writeFile(path, JSON.stringify(migrations, null, 2) + "\n");
  }
  const key = adopted?.key ?? keys.native;
  entries.push(
    [`${prefix}${key}-cargo`, "/cache/cargo"],
    [`${prefix}${key}-rust`, "/work/lapis-desktop/src-tauri/target"],
  );
  return entries;
}
