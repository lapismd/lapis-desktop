# Published Mira, jj-history, and lapis-ai git pins

```json
{
  "id": "E-DEPENDENCY-004",
  "date": "2026-10-29",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M1", "M10.1"],
  "requirements": ["LD-GOV-002", "LD-GOV-003", "LD-GOV-006", "LD-AI-001"],
  "contractReview": "Desktop now consumes published @lapismd/mira ~0.1.2 and @lapismd/jj-history ~0.1.0 from npm. lapis-ai-capture, tauri-plugin-lapis-ai, and lapis-ai-app-tools resolve from git tag v0.2.0 at version 0.2.0. Companion Mira packages stay at 0.0.3. @lapismd/ai, @lapismd/jj-conversations, @lapismd/terminal, tauri-plugin-lapis-terminal, and jj-store crate paths stay because they have no npm release and no crate tag. No product API was rewritten.",
  "milestoneReview": "M1 and M10.1 stay Done on their original gates. This record does not complete distribution, publication, or the default sibling cutover. The default jj-store checkout still requires lapis-ai-capture ^0.1.1, so cargo fetch --locked there fails until that checkout uses the same git tag.",
  "versions": {
    "mira": "0.1.2",
    "miraIntegrity": "sha512-7QQsCm8q1T6XnbszhK+g9u5VMlLLu60ECT3iru8oTAncT8z2orLd5PLxUcZnFfCKVp/ivSjD691YkLhtGKYagw==",
    "jjHistory": "0.1.0",
    "jjHistoryIntegrity": "sha512-n8X3Pc5zWKLpx3NvZGVJGDnCUNAzGzcJonZ9YFgvDih3FZD3xg/tZe7ooTU3L5AkYK9Ia5uBaVN8WIG610gxCg==",
    "lapisAiTag": "v0.2.0",
    "lapisAiCommit": "9a98293c26524c9320acdd9767e34e8ffdd7170c",
    "node": "24.10.0",
    "pnpm": "10.34.5",
    "rustc": "1.99.0",
    "jj": "0.45.1"
  },
  "files": [
    "package.json",
    "pnpm-lock.yaml",
    "src-tauri/Cargo.toml",
    "src-tauri/Cargo.lock",
    "scripts/source-audit.mjs",
    "tests/governance/source-audit.test.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-DEPENDENCY-004.md",
    "spec/src/history/current-intake.md",
    "MIGRATION.md"
  ],
  "remaining": [],
  "runs": [
    {
      "name": "registry-metadata",
      "command": "npm view @lapismd/mira@0.1.2 version dist.integrity; npm view @lapismd/jj-history@0.1.0 version dist.integrity",
      "result": "pass",
      "failures": 0,
      "note": "npm reports mira 0.1.2 and jj-history 0.1.0 with the integrities recorded above."
    },
    {
      "name": "frozen-lock-install",
      "command": "pnpm install --frozen-lockfile --ignore-scripts",
      "result": "pass",
      "failures": 0,
      "note": "The refreshed lock installs @lapismd/mira 0.1.2 and @lapismd/jj-history 0.1.0 from the pnpm store. Neither is a sibling link. @lapismd/ai, @lapismd/jj-conversations, and @lapismd/terminal remain links. Companion lock entries stay at the previously locked 0.0.2; package.json still declares ~0.0.3."
    },
    {
      "name": "git-tag-fetch-and-compile",
      "command": "RUSTUP_TOOLCHAIN=1.99.0 cargo fetch --manifest-path src-tauri/Cargo.toml; cargo check --all-targets --offline; cargo check --all-targets --features e2e --offline",
      "result": "pass",
      "failures": 0,
      "note": "Resolved against the jj-store git-pins workspace and a scratch Notes copy whose lapis-ai-service line uses the same tag. Locked lapis-ai-capture, tauri-plugin-lapis-ai, lapis-ai-app-tools, lapis-ai-config, lapis-ai-runtime, and lapis-ai-service at v0.2.0#9a98293c. Both check commands finished. No desktop API edits."
    },
    {
      "name": "default-sibling-fetch",
      "command": "RUSTUP_TOOLCHAIN=1.99.0 cargo fetch --manifest-path src-tauri/Cargo.toml --locked --offline",
      "result": "fail",
      "failures": 1,
      "note": "The default jj-store checkout still requires lapis-ai-capture ^0.1.1 while the tagged crate is 0.2.0. This checkout was not edited. The git-pins workspace already uses the tag."
    },
    {
      "name": "source-audit",
      "command": "node --test tests/governance/source-audit.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "11 tests, 0 failures. A ~0.1.0 jj-history range is admitted. The former sibling link is rejected."
    },
    {
      "name": "spec-first",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "note": "8 protected files and 4 canonical chapters. spec:validate still reports pre-existing byte and line overflows in verification.md and history/index.md; desktop.md is within the byte cap."
    }
  ]
}
```

The frozen install used the refreshed lock in an isolated project whose direct
ranges match that lock. The default Desktop checkout still cannot select the git
tag while `jj-store-capture` requires `^0.1.1`.
