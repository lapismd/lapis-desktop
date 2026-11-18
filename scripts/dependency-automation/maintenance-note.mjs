import { isMap, parseDocument } from "yaml";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { resolve } from "node:path";

export const managedMaintenanceNote = (path) =>
  /^\.changeset\/lapis-dependencies-[a-f0-9]{12}\.md$/u.test(path);

export function loadMaintenanceNotes(root, changedFiles, files) {
  const consumed = [];
  for (const path of changedFiles.filter(managedMaintenanceNote)) {
    const target = resolve(root, path),
      stat = lstatSync(target, { throwIfNoEntry: false });
    if (stat === undefined) {
      consumed.push(path);
      continue;
    }
    if (!stat.isFile() || realpathSync(target) !== target || stat.size > 8192)
      throw Error("Desktop canonical intake: unsafe maintenance note");
    files[path] = new TextDecoder("utf-8", {
      fatal: true,
      ignoreBOM: true,
    }).decode(readFileSync(target));
  }
  return consumed;
}

export function verifyMaintenanceLifecycle(
  files,
  changedFiles,
  consumed,
  unchanged,
) {
  const raw = changedFiles.filter((p) => p.startsWith(".changeset/"));
  if (
    raw.length > 1 ||
    raw.some((p) => !managedMaintenanceNote(p)) ||
    new Set(consumed).size !== consumed.length ||
    consumed.some((p) => !raw.includes(p) || Object.hasOwn(files, p))
  )
    throw Error("Desktop canonical intake: invalid maintenance inventory");
  maintenanceNotePaths(
    files,
    unchanged
      ? changedFiles.filter((p) => !consumed.includes(p))
      : changedFiles,
  );
}

export function maintenanceNotePaths(files, changedFiles) {
  const paths = changedFiles.filter((path) => path.startsWith(".changeset/"));
  const fail = () => {
    throw Error("Desktop canonical intake: invalid empty maintenance note");
  };
  if (paths.length > 1) fail();
  for (const path of paths) {
    const text = files[path];
    if (
      !managedMaintenanceNote(path) ||
      typeof text !== "string" ||
      Buffer.byteLength(text, "utf8") > 8192
    )
      fail();
    const lines = text.split(/\r?\n/u);
    const end = lines.indexOf("---", 1);
    if (
      lines[0] !== "---" ||
      end < 1 ||
      !lines
        .slice(end + 1)
        .join("\n")
        .trim()
    )
      fail();
    const header = lines.slice(1, end).join("\n");
    const document = parseDocument(header);
    if (
      document.errors.length ||
      document.warnings.length ||
      (header.trim() &&
        (!isMap(document.contents) || document.contents.items.length))
    )
      fail();
  }
  return paths;
}

export function verifyMaintenanceScope(changedFiles, files, allowedPaths) {
  const notes = maintenanceNotePaths(files, changedFiles);
  if (
    changedFiles.some(
      (path) => !allowedPaths.includes(path) && !notes.includes(path),
    )
  )
    throw Error("Desktop canonical intake: unexpected source scope");
}
