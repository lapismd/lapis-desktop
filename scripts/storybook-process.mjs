import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);
async function output(command, args, absent = false) {
  try {
    return (
      await exec(command, args, {
        env: { ...process.env, LC_ALL: "C" },
        timeout: 5000,
        maxBuffer: 4 * 1024 * 1024,
      })
    ).stdout;
  } catch (error) {
    if (absent && error.code === 1 && !error.killed) return "";
    throw error;
  }
}
export async function inspectProcess(pid) {
  const args = ["-ww", "-p", String(pid), "-o", "uid=,lstart=,stat=,command="];
  const text = (await output("ps", args, true)).trim();
  if (!text) return;
  const match = text.match(/^(\d+)\s+(.{24})\s+(\S+)\s+(.+)$/);
  if (!match) throw new Error("Cannot establish preview process identity");
  if (match[3].startsWith("Z")) return;
  const cwd = (
    await output("lsof", ["-a", "-p", String(pid), "-d", "cwd", "-Fn"], true)
  )
    .split("\n")
    .find((line) => line.startsWith("n"))
    ?.slice(1);
  if (!cwd) {
    const later = (await output("ps", args, true)).trim();
    if (
      !later ||
      later.match(/^(\d+)\s+(.{24})\s+(\S+)\s+(.+)$/)?.[3].startsWith("Z")
    )
      return;
    throw Object.assign(
      new Error("Cannot establish preview process directory"),
      { code: "PREVIEW_IDENTITY_UNAVAILABLE" },
    );
  }
  return {
    pid,
    uid: Number(match[1]),
    started: match[2],
    command: match[4],
    cwd,
  };
}
export function sameProcess(a, b) {
  return (
    !!a &&
    !!b &&
    ["pid", "uid", "started", "command", "cwd"].every(
      (key) => a[key] === b[key],
    )
  );
}
export async function listeners(port) {
  return [
    ...new Set(
      (
        await output(
          "lsof",
          ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"],
          true,
        )
      )
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(Number),
    ),
  ];
}
export function usesCatalogCache(command) {
  return /(?:storybook\/dist\/bin\/dispatcher\.js\s+(?:dev|build)|vitest\/(?:vitest\.mjs|dist\/)|vite\/bin\/vite\.js)/.test(
    command,
  );
}
export async function cacheConsumers(root) {
  const listing = await output(
    "lsof",
    ["-a", "-u", String(process.getuid()), "-c", "node", "-d", "cwd", "-Fn"],
    true,
  );
  const pids = [];
  let pid;
  for (const line of listing.split("\n")) {
    if (line.startsWith("p")) pid = Number(line.slice(1));
    if (line === `n${root}` && pid !== process.pid) pids.push(pid);
  }
  const consumers = [];
  for (const id of new Set(pids)) {
    const observed = await inspectProcess(id);
    if (observed && usesCatalogCache(observed.command))
      consumers.push(observed);
  }
  return consumers;
}
