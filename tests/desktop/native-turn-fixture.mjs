import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

/** Isolated protocol peer; it never starts a real provider or uses a user profile. */
export function nativeTurnFixture() {
  mkdirSync(".local/native-test", { recursive: true });
  const root = mkdtempSync(resolve(".local/native-test/core-chat-"));
  const vault = join(root, "Vault"),
    bundle = join(root, "helpers"),
    bin = join(root, "bin");
  for (const path of [
    join(root, "profile"),
    join(vault, ".lapis"),
    bundle,
    bin,
  ])
    mkdirSync(path, { recursive: true });
  const log = join(root, "worker.jsonl");
  const peer = readFileSync(
    resolve(
      "../lapis-server/crates/lapis-app-core/tests/support/native_turn/peer.py",
    ),
    "utf8",
  ).replace("os.environ['LOG']", JSON.stringify(log));
  const helpers = [
    "lapis-acp",
    "lapis-agent",
    "lapis-agent-tools",
    "lapis-compute",
  ];
  let manifest =
    'version = 1\npackage_version = "0.2.0"\ntarget = "aarch64-apple-darwin"\n';
  for (const name of helpers) {
    const body = name === "lapis-acp" ? peer : "#!/bin/sh\nexit 1\n";
    writeFileSync(join(bundle, name), body, { mode: 0o700 });
    manifest += `\n[[binary]]\nname = "${name}"\npath = "${name}"\nsha256 = "${createHash("sha256").update(body).digest("hex")}"\n`;
  }
  writeFileSync(join(bundle, "runtime-manifest.toml"), manifest);
  writeFileSync(join(bin, "codex-acp"), "#!/bin/sh\nexit 1\n", { mode: 0o700 });
  writeFileSync(
    join(root, "profile/ai-runtime.json"),
    JSON.stringify({ version: 1, bundle, path: [bin] }),
  );
  writeFileSync(
    join(vault, ".lapis/core-plugins.json"),
    JSON.stringify({ disabled: [], enabled: ["ai"] }),
  );
  writeFileSync(join(vault, "Note.md"), "# Preserved native chat fixture\n");
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  return { root, vault, log };
}
