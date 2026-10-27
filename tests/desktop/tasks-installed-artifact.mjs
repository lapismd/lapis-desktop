// Adapted from Notes 0ff929b1 packages/web/e2e/tasks-installed-plugin.ts.
// This bundles the verified public package; no Task implementation lives here.
import { build } from "vite";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pluginImportMap } from "../../scripts/plugin-host-modules.ts";
import { verifyArchiveResolution } from "../../scripts/archive-resolution.mjs";
import {
  artifactPaths,
  assertTaskHostModules,
  digest,
  readTasksArtifact,
  taskPackageName,
} from "./tasks-installed-assets.mjs";

export async function buildTasksArtifact(
  manifestPath,
  directory = resolve(".local/native-tasks/artifact"),
) {
  const source = JSON.parse(readFileSync(manifestPath, "utf8")).find(
    (entry) => entry.name === taskPackageName,
  );
  if (!source)
    throw new Error(
      `Add the qualified ${taskPackageName} archive to the private acceptance manifest`,
    );
  const tarball = resolve(dirname(manifestPath), source.path);
  if (digest(readFileSync(tarball)) !== source.sha256)
    throw new Error("Task public archive hash changed");
  const repository = process.cwd();
  // Reuse the normal complete installed-package fingerprint checker, before
  // bundling any bytes. Manifests and published dependency ranges stay intact.
  verifyArchiveResolution(repository, [{ ...source, tarball }]);
  const require = createRequire(join(repository, "package.json"));
  const entry = require.resolve(taskPackageName);
  const pkg = JSON.parse(
    readFileSync(join(dirname(dirname(entry)), "package.json"), "utf8"),
  );
  if (pkg.name !== taskPackageName || pkg.version !== source.version)
    throw new Error("Task public package identity changed");
  const renderer = JSON.parse(
    readFileSync(require.resolve("svelte/package.json"), "utf8"),
  ).version;
  mkdirSync(dirname(directory), { recursive: true });
  const input = join(dirname(directory), "entry.mjs");
  writeFileSync(
    input,
    `export { default } from "${taskPackageName}";\nimport "${taskPackageName}/styles.css";\n`,
  );
  const result = await build({
    root: repository,
    configFile: false,
    publicDir: false,
    base: "./",
    logLevel: "warn",
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    plugins: [
      {
        name: "native-tasks-public-host-modules",
        enforce: "pre",
        resolveId(id) {
          if (id === "svelte" || id.startsWith("svelte/"))
            return {
              id: `svelte/renderer/${renderer}${id.slice("svelte".length)}`,
              external: true,
            };
          if (
            id === "@lapis-notes/api" ||
            id.startsWith("@lapis-notes/api/") ||
            (id.startsWith("@codemirror/") &&
              Object.hasOwn(pluginImportMap.imports, id))
          )
            return { id, external: true };
        },
      },
      svelte({ preprocess: vitePreprocess() }),
    ],
    resolve: { dedupe: ["svelte"] },
    build: {
      lib: {
        entry: input,
        formats: ["es"],
        fileName: () => "main.mjs",
        cssFileName: "styles",
      },
      outDir: directory,
      emptyOutDir: true,
      cssCodeSplit: false,
      minify: false,
      target: "es2022",
      rollupOptions: { output: { assetFileNames: "[name][extname]" } },
    },
  });
  const shared = new Set();
  for (const output of Array.isArray(result) ? result : [result]) {
    if (!("output" in output)) throw new Error("Unexpected Tasks watch build");
    const emitted = new Set(output.output.map((asset) => asset.fileName));
    for (const chunk of output.output)
      if (chunk.type === "chunk")
        for (const specifier of [...chunk.imports, ...chunk.dynamicImports])
          if (!emitted.has(specifier)) shared.add(specifier);
  }
  assertTaskHostModules([...shared], pluginImportMap.imports);
  writeFileSync(
    join(directory, "manifest.json"),
    JSON.stringify({
      id: "tasks",
      name: "Tasks",
      version: pkg.version,
      minAppVersion: "0.1.0",
      description: pkg.description,
      author: "Lapis Notes",
      lapis: {
        manifestVersion: 1,
        runtime: {
          entries: {
            workspace: {
              path: "main.mjs",
              format: "esm",
              sharedDependencies: [...shared].sort(),
              requiresReloadOnUpdate: true,
            },
          },
        },
      },
    }),
  );
  writeFileSync(
    join(dirname(directory), "provenance.json"),
    JSON.stringify(
      {
        schema: 1,
        package: {
          name: pkg.name,
          version: pkg.version,
          sha256: source.sha256,
          source: source.source ?? null,
        },
        files: artifactPaths(directory).map((path) => {
          const bytes = readFileSync(join(directory, path));
          return { path, size: bytes.length, sha256: digest(bytes) };
        }),
      },
      null,
      2,
    ) + "\n",
  );
  readTasksArtifact(directory);
  return directory;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  if (!process.argv[2])
    throw new Error("Pass the verified private Tasks archive manifest");
  console.log(
    await buildTasksArtifact(
      resolve(process.argv[2]),
      process.argv[3] && resolve(process.argv[3]),
    ),
  );
}
