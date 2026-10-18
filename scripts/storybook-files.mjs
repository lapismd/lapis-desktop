import {
  lstat,
  mkdir,
  open,
  readFile,
  unlink,
  rm,
  link,
  access,
} from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export async function safePath(root, relative) {
  if (
    relative.split("/").some((part) => !part || part === ".." || part === ".")
  )
    throw new Error("Invalid preview path");
  let path = root;
  for (const part of relative.split("/")) {
    path = join(path, part);
    try {
      if ((await lstat(path)).isSymbolicLink())
        throw new Error(`Refusing symlink: ${path}`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return path;
}
export async function readRecord(path) {
  try {
    const stat = await lstat(path);
    if (!stat.isFile() || stat.size > 16384 || stat.uid !== process.getuid())
      throw new Error(`Invalid preview record: ${path}`);
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
export async function writeRecord(path, value) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  const file = await open(temporary, "wx", 0o600);
  try {
    await file.writeFile(JSON.stringify(value) + "\n");
    await file.sync();
  } finally {
    await file.close();
  }
  try {
    await link(temporary, path);
  } finally {
    await unlink(temporary);
  }
}
export async function preflightLog(root, port) {
  const path = await safePath(root, `.local/storybook/${port}.log`);
  try {
    const entry = await lstat(path);
    if (!entry.isFile() || entry.nlink !== 1 || entry.uid !== process.getuid())
      throw new Error("Invalid preview log");
    await access(path, constants.W_OK);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return path;
}
export async function withLease(root, action) {
  const directory = await safePath(root, ".local/storybook");
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const path = join(directory, "maintenance.lock"),
    nonce = randomUUID();
  try {
    await writeRecord(path, { pid: process.pid, nonce });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const old = await readRecord(path);
    if (
      !Number.isSafeInteger(old?.pid) ||
      old.pid <= 0 ||
      typeof old.nonce !== "string"
    )
      throw new Error("Invalid preview maintenance lease");
    try {
      process.kill(old.pid, 0);
      throw new Error("Preview maintenance is already running");
    } catch (error) {
      if (error.code !== "ESRCH") throw error;
    }
    if ((await readRecord(path))?.nonce !== old.nonce)
      throw new Error("Preview maintenance lease changed");
    await unlink(path);
    await writeRecord(path, { pid: process.pid, nonce });
  }
  try {
    return await action();
  } finally {
    if ((await readRecord(path))?.nonce === nonce) await unlink(path);
  }
}
export async function cleanCaches(root, apply, consumers) {
  const targets = [];
  for (const relative of [
    "node_modules/.cache/storybook",
    "node_modules/.vite",
  ]) {
    const path = await safePath(root, relative);
    try {
      if (!(await lstat(path)).isDirectory())
        throw new Error(`Invalid cache directory: ${path}`);
      targets.push(path);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  const active = await consumers(root);
  if (apply && active.length)
    throw new Error(
      `Stop checkout cache consumers first (PID ${active.map((p) => p.pid).join(", ")})`,
    );
  if (apply) for (const path of targets) await rm(path, { recursive: true });
  return { apply, targets, consumers: active.map((p) => p.pid) };
}
