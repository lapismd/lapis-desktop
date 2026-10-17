import assert from "node:assert/strict";
import { createHash, createPublicKey, verify } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** Seeds only independently verified test-signed public archives, not source. */
export function seedVerifiedPortablePlugins(vault, ids) {
  const receipt = JSON.parse(
    readFileSync(
      process.env.LAPIS_DESKTOP_PORTABLE_FIXTURES ??
        resolve(".local/m83/portable-candidates/manifest.json"),
      "utf8",
    ),
  );
  const key = createPublicKey({
    format: "jwk",
    key: {
      kty: "OKP",
      crv: "Ed25519",
      x: Buffer.from(receipt.publicKey.publicKey, "base64").toString(
        "base64url",
      ),
    },
  });
  const now = new Date(0).toISOString();
  const plugins = {};
  for (const id of ids) {
    const entry = receipt.entries.find(
      (candidate) => candidate.pluginId === id,
    );
    assert.ok(entry, `Prepare the portable archive fixture for ${id}`);
    assert.equal(digest(readFileSync(entry.archive)), entry.sha256);
    const envelope = JSON.parse(
      readFileSync(join(dirname(entry.archive), "release.signed.json"), "utf8"),
    );
    const signature = envelope.signatures.find(
      (item) => item.keyId === receipt.publicKey.keyId,
    );
    assert.ok(signature);
    // The producer serializes this file canonically; parsed key order retains
    // that exact signed payload without a second canonicalizer implementation.
    const payload = JSON.stringify(envelope.signed);
    assert.equal(
      verify(
        null,
        Buffer.from(payload),
        key,
        Buffer.from(signature.sig, "base64"),
      ),
      true,
    );
    const release = envelope.signed;
    assert.equal(release.pluginId, id);
    assert.equal(release.source.commit, receipt.sourceCommit);
    for (const file of release.files) {
      assert.equal(
        file.path.split("/").some((part) => ["", ".", ".."].includes(part)),
        false,
      );
      const bytes = readFileSync(join(entry.filesDirectory, file.path));
      assert.equal(bytes.length, file.size);
      assert.equal(digest(bytes), file.sha256);
      const destination = join(vault, ".lapis/plugins", id, file.path);
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, bytes);
    }
    plugins[id] = {
      pluginId: id,
      installedVersion: release.version,
      installedAt: now,
      updatedAt: now,
      provenance: "official",
      releaseManifestSha256: digest(payload),
      files: release.files,
      signature,
    };
  }
  mkdirSync(join(vault, ".lapis"), { recursive: true });
  writeFileSync(
    join(vault, ".lapis/installed-plugins.json"),
    JSON.stringify({ schemaVersion: 1, updatedAt: now, plugins }, null, 2),
  );
  writeFileSync(
    join(vault, ".lapis/community-plugins.json"),
    JSON.stringify(ids),
  );
}
