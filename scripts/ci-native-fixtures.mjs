// Assemble real public plugin artifacts for isolated hosted native acceptance.
// Signing keys are ephemeral fixtures and never publish or alter trust defaults.
import { execFileSync } from "node:child_process";
import { createHash, generateKeyPairSync } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { buildTasksArtifact } from "../tests/desktop/tasks-installed-artifact.mjs";

const root = process.cwd();
const plugins = resolve("../lapis-plugins");
const sources = JSON.parse(readFileSync("scripts/ci-sources.json", "utf8"));
const source = sources.find((entry) => entry.name === "lapis-plugins");
// Registry intake no longer builds Bases or History from this checkout, but
// release signing still imports fflate and the plugin build still needs Vite.
if (!existsSync(join(plugins, "node_modules/fflate/package.json"))) {
  execFileSync("pnpm", ["install", "--frozen-lockfile"], {
    cwd: plugins,
    stdio: "inherit",
  });
}
const tools = await import(
  pathToFileURL(join(plugins, "scripts/plugin-release.mjs"))
);
const output = resolve(".local/ci-native-plugins");
const keyFile = join(output, "ephemeral-key.pem");
mkdirSync(output, { recursive: true });
const key = generateKeyPairSync("ed25519");
writeFileSync(
  keyFile,
  key.privateKey.export({ type: "pkcs8", format: "pem" }),
  { mode: 0o600 },
);
const keyId = "desktop-ci-fixtures";
const entries = [];
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
try {
  for (const directory of [
    "bookmarks",
    "wordcount",
    "slides",
    "bases",
    "history",
    "markdown-lint",
    "spellcheck",
  ]) {
    execFileSync(
      process.execPath,
      [
        "scripts/build-plugin-release.mjs",
        "--plugin",
        directory,
        "--commit",
        source.revision,
      ],
      {
        cwd: plugins,
        stdio: "inherit",
      },
    );
    const manifest = JSON.parse(
      readFileSync(
        join(plugins, "packages", directory, "manifest.json"),
        "utf8",
      ),
    );
    const releaseDir = join(
      plugins,
      ".release/plugins",
      `${manifest.id}-${manifest.version}`,
    );
    const signedReleasePath = join(releaseDir, "release.signed.json");
    await tools.signReleaseManifest({
      input: join(releaseDir, "release.json"),
      out: signedReleasePath,
      keyId,
      privateKeyFile: keyFile,
    });
    const archive = join(
      releaseDir,
      `${manifest.id}-${manifest.version}.lapis-plugin`,
    );
    await tools.buildSignedPluginBundle({
      pluginId: manifest.id,
      version: manifest.version,
      releaseDir,
      signedReleasePath,
      out: archive,
    });
    entries.push({
      pluginId: manifest.id,
      version: manifest.version,
      archive,
      sha256: digest(readFileSync(archive)),
      filesDirectory: join(releaseDir, "files"),
      record: JSON.parse(
        readFileSync(join(releaseDir, "release.json"), "utf8"),
      ),
    });
  }
  writeFileSync(
    join(output, "manifest.json"),
    JSON.stringify(
      {
        sourceCommit: source.revision,
        publicKey: {
          keyId,
          publicKey: key.publicKey
            .export({ type: "spki", format: "der" })
            .subarray(-32)
            .toString("base64"),
        },
        entries,
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  rmSync(keyFile, { force: true });
}

const tasks = resolve("../lapis-plugin-tasks");
const archiveDirectory = join(output, "tasks");
mkdirSync(archiveDirectory, { recursive: true });
execFileSync(
  "pnpm",
  [
    "--config.ignore-scripts=true",
    "pack",
    "--pack-destination",
    archiveDirectory,
  ],
  { cwd: tasks, stdio: "inherit" },
);
const tarballs = readdirSync(archiveDirectory).filter((name) =>
  name.endsWith(".tgz"),
);
if (tarballs.length !== 1)
  throw Error("Expected exactly one Tasks public archive");
const archive = join(archiveDirectory, tarballs[0]);
const pkg = JSON.parse(readFileSync(join(tasks, "package.json"), "utf8"));
const taskManifest = join(output, "tasks-archives.json");
writeFileSync(
  taskManifest,
  JSON.stringify([
    {
      name: pkg.name,
      version: pkg.version,
      path: archive,
      sha256: digest(readFileSync(archive)),
      source: sources.find((entry) => entry.name === "lapis-plugin-tasks"),
    },
  ]),
);
await buildTasksArtifact(taskManifest);
console.log(`Prepared native public plugin fixtures in ${root}`);
