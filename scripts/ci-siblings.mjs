#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function sourceUrl(source) {
  if (
    !/^[a-z0-9-]+$/u.test(source.name) ||
    !/^[a-z0-9-]+\/[a-z0-9-]+$/iu.test(source.repository) ||
    !/^[a-f0-9]{40}$/u.test(source.revision)
  )
    throw Error("CI sources require a repository and full commit identity");
  return `https://codeload.github.com/${source.repository}/tar.gz/${source.revision}`;
}

export async function prepareSources(parent = dirname(process.cwd())) {
  const sources = JSON.parse(
    readFileSync(new URL("ci-sources.json", import.meta.url)),
  );
  for (const source of sources) {
    const url = sourceUrl(source);
    const destination = join(parent, source.name);
    const receipt = join(destination, ".desktop-ci-source.json");
    if (existsSync(destination)) {
      if (
        !existsSync(receipt) ||
        readFileSync(receipt, "utf8") !== JSON.stringify(source)
      )
        throw Error(`Refusing to replace an existing sibling: ${destination}`);
      continue;
    }
    const temporary = await mkdtemp(join(tmpdir(), "desktop-ci-source-"));
    try {
      const response = await fetch(url);
      if (!response.ok)
        throw Error(`Source download failed: ${response.status} ${url}`);
      const archive = join(temporary, "source.tar.gz");
      writeFileSync(archive, Buffer.from(await response.arrayBuffer()));
      mkdirSync(destination);
      execFileSync("tar", [
        "-xzf",
        archive,
        "--strip-components=1",
        "-C",
        destination,
      ]);
      if (source.name === "lapis-ai") {
        const jj = (...args) =>
          execFileSync("jj", ["--no-pager", ...args], { cwd: destination });
        jj("git", "init", "--colocate", ".");
        writeFileSync(
          join(destination, ".git/info/exclude"),
          ".desktop-ci-source.json\n",
        );
        jj(
          "git",
          "remote",
          "add",
          "origin",
          `https://github.com/${source.repository}`,
        );
        jj("git", "fetch", "--tag", "v0.2.0");
        jj("new", source.revision, "-m", "Pinned Desktop CI source");
      }
      writeFileSync(receipt, JSON.stringify(source));
      console.log(`Prepared ${source.name} at ${source.revision}`);
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  await prepareSources();
