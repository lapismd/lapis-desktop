import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pluginHostModuleRegistry } from "@lapis-notes/api/plugin-host-modules";

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const svelteModule = Object.keys(pluginHostModuleRegistry).find((id) =>
  /^svelte\/renderer\/[^/]+$/u.test(id),
);
assert.ok(svelteModule, "The signed fixture requires the public renderer ABI");
const canonical = (value) => JSON.stringify(sort(value));
function sort(value) {
  if (Array.isArray(value)) return value.map(sort);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sort(value[key])]),
    );
  return value;
}

/** Ephemeral fixture signatures are never published or trusted by production. */
export function prepareDistributionFixtures(
  directory = resolve(".local/native-install"),
) {
  mkdirSync(directory, { recursive: true });
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const keyId = "native-install-acceptance";
  const trustedKey = {
    keyId,
    alg: "ed25519",
    trustTier: "official",
    publicKey: Buffer.from(
      publicKey.export({ format: "jwk" }).x,
      "base64url",
    ).toString("base64"),
  };
  function envelope(signed) {
    return {
      signed,
      signatures: [
        {
          keyId,
          alg: "ed25519",
          sig: sign(null, Buffer.from(canonical(signed)), privateKey).toString(
            "base64",
          ),
        },
      ],
    };
  }
  function inline(signed) {
    return { ...signed, signatures: envelope(signed).signatures };
  }
  const origin = "https://native-install.invalid/v1/";
  const responses = {};
  const bundles = {};
  const entries = [];
  const json = (path, value) => {
    responses[origin + path] = {
      body: JSON.stringify(value),
      encoding: "utf8",
    };
  };
  const runtime = {
    entries: {
      workspace: {
        path: "main.mjs",
        format: "esm",
        sharedDependencies: ["@lapis-notes/api", svelteModule],
        requiresReloadOnUpdate: true,
      },
    },
  };

  function release(id, version, files, options = {}) {
    const manifest = JSON.parse(files["manifest.json"]);
    const releaseRuntime = manifest.lapis?.runtime;
    const signed = envelope({
      schemaVersion: 1,
      type: "lapis.plugin.release",
      pluginId: id,
      version,
      channel: options.channel ?? "official",
      compatibility: {
        minAppVersion: options.minAppVersion ?? "0.1.0",
        platforms: ["desktop"],
      },
      ...(releaseRuntime ? { runtime: releaseRuntime } : {}),
      files: Object.entries(files).map(([path, bytes]) => ({
        path,
        sha256: digest(bytes),
        size: Buffer.byteLength(bytes),
      })),
    });
    const root = join(directory, id, version);
    mkdirSync(root, { recursive: true });
    writeFileSync(join(root, "release.signed.json"), canonical(signed));
    for (const [path, bytes] of Object.entries(files)) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(
        join(root, path),
        options.tamper && path === "main.mjs" ? "tampered bytes" : bytes,
      );
    }
    if (options.invalidSignature) {
      signed.signatures[0].sig = Buffer.alloc(64).toString("base64");
      writeFileSync(join(root, "release.signed.json"), canonical(signed));
    }
    // Put the signed release first, as required by the production bundle reader.
    const archive = join(root, "bundle.lapis-plugin");
    execFileSync(
      "/usr/bin/zip",
      ["-q", "-0", "-X", archive, "release.signed.json", ...Object.keys(files)],
      { cwd: root },
    );
    const bytes = readFileSync(archive);
    const url = `releases/${id}-${version}.lapis-plugin`;
    bundles[`${id}@${version}`] = bytes.toString("base64");
    responses[origin + url] = {
      encoding: "base64",
      body: bytes.toString("base64"),
    };
    return {
      version,
      minAppVersion: options.minAppVersion ?? "0.1.0",
      releasedAt: "2026-10-17T00:00:00.000Z",
      platforms: ["desktop"],
      bundle: { url: `../${url}`, sha256: digest(bytes), size: bytes.length },
    };
  }
  function plugin(id, versions, options = {}) {
    const releases = {};
    for (const version of versions) {
      const main =
        options.broken && version === "1.0.0"
          ? 'throw new Error("Native failed-load fixture");'
          : `import { Plugin } from "@lapis-notes/api";
import { tick } from "${svelteModule}";
export default class NativeLifecycle extends Plugin {
  sharedTick = tick;
  async onload() {
    await tick();
    this.addCommand({ id: "version", name: "Native installation version", callback: () => "${version}" });
    this.addCommand({ id: "save", name: "Save native plugin data", callback: () => this.saveData({ saved: "café 笔记", version: "${version}" }) });
    const timer = setInterval(() => { globalThis.__lapisInstallTicks = (globalThis.__lapisInstallTicks ?? 0) + 1; }, 50);
    this.register(() => clearInterval(timer));
  }
}`;
      const manifest = {
        id,
        name: id,
        version,
        author: "Native acceptance",
        minAppVersion: "0.1.0",
        description: "Signed native installation fixture",
        lapis: { manifestVersion: 1, runtime: options.runtime ?? runtime },
        ...(options.capability
          ? { requiredCapabilities: [options.capability] }
          : {}),
        ...(options.services
          ? { requiredNativeServices: options.services }
          : {}),
      };
      releases[version] = release(
        id,
        version,
        {
          "manifest.json": JSON.stringify(manifest),
          "main.mjs": main,
          "data.json": '{"default":true}',
        },
        options,
      );
    }
    addCatalog(
      id,
      releases,
      options.latest ?? versions.at(-1),
      options.channel,
    );
  }
  function addCatalog(
    id,
    versions,
    latestVersion,
    channel = "official",
    name = id,
  ) {
    entries.push({
      id,
      name,
      description: "Signed native installation fixture",
      author: "Native acceptance",
      channel,
      latestVersion,
      minAppVersion: "0.1.0",
      platforms: ["desktop"],
      categories: ["utilities"],
      badges: [channel, "verified"],
      detail: `plugins/${id}.json`,
    });
    json(
      `plugins/${id}.json`,
      inline({
        schemaVersion: 1,
        id,
        name,
        description: "Signed native installation fixture",
        channel,
        owner: { name: "Native acceptance", verified: true },
        latestVersion,
        versions,
      }),
    );
  }
  plugin("native-lifecycle", ["1.0.0", "2.0.0"]);
  plugin("native-failure", ["1.0.0", "2.0.0"], { broken: true });
  plugin("native-invalid-signature", ["1.0.0"], { invalidSignature: true });
  plugin("native-tampered", ["1.0.0"], { tamper: true });
  plugin("native-incompatible", ["1.0.0"], { minAppVersion: "999.0.0" });
  plugin("native-capability", ["1.0.0"], { capability: "vault:read" });
  plugin("native-node", ["1.0.0"], {
    channel: "community",
    runtime: {
      entries: { electronSidecar: { path: "main.mjs", format: "node-esm" } },
    },
  });
  plugin("native-electron", ["1.0.0"], {
    channel: "community",
    runtime: {
      entries: { electronRenderer: { path: "main.mjs", format: "esm" } },
    },
  });
  plugin("native-service", ["1.0.0"], {
    channel: "community",
    runtime: {
      entries: { trustedDesktop: { path: "main.mjs", format: "node-esm" } },
    },
  });
  plugin("terminal", ["1.0.0"]);
  plugin("native-supported-service", ["1.0.0"], {
    services: ["notifications"],
  });
  plugin("native-unsupported-service", ["1.0.0"], {
    services: ["agent-runtime"],
  });
  plugin("ai", ["1.0.0"]);

  const portable = JSON.parse(
    readFileSync(
      resolve(".local/m83/portable-candidates/manifest.json"),
      "utf8",
    ),
  );
  const wordcount = portable.entries.find(
    (entry) => entry.pluginId === "wordcount",
  );
  assert.ok(wordcount, "Prepare the verified portable Word Count candidate");
  assert.equal(digest(readFileSync(wordcount.archive)), wordcount.sha256);
  const files = Object.fromEntries(
    wordcount.record.files.map((file) => {
      const bytes = readFileSync(join(wordcount.filesDirectory, file.path));
      assert.equal(digest(bytes), file.sha256);
      return [file.path, bytes];
    }),
  );
  const real = release("wordcount", wordcount.version, files);
  addCatalog(
    "wordcount",
    { [wordcount.version]: real },
    wordcount.version,
    "official",
    "Word Count",
  );
  json(
    "index.json",
    inline({
      schemaVersion: 1,
      generatedAt: "2026-10-17T00:00:00.000Z",
      plugins: entries,
    }),
  );
  json(
    "revoked.json",
    inline({
      schemaVersion: 1,
      generatedAt: "2026-10-17T00:00:00.000Z",
      revoked: [],
    }),
  );
  const source = {
    id: "native-install",
    name: "Native signed acceptance",
    url: origin + "index.json",
    trustTier: "official",
    enabled: true,
    builtin: true,
  };
  const result = {
    trustedKeys: [trustedKey],
    source,
    responses,
    bundles,
    wordcount: {
      sourceCommit: portable.sourceCommit,
      archiveSha256: wordcount.sha256,
    },
  };
  writeFileSync(
    join(directory, "public.json"),
    JSON.stringify(result, null, 2) + "\n",
  );
  return result;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  prepareDistributionFixtures();
  console.log(
    "Prepared native signed installation fixtures; private key was held only in memory.",
  );
}
