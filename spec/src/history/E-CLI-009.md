# Desktop MCP and approved local CLI access

```json
{
  "id": "E-CLI-009",
  "date": "2026-11-23",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-CLI-002", "LD-CLI-003"],
  "files": [
    "spec/src/backlog/distribution.md",
    "spec/src/current/integration.md",
    "spec/src/verification.md",
    "src-tauri/Cargo.lock",
    "src-tauri/Cargo.toml",
    "src-tauri/src/cli/content.rs",
    "src-tauri/src/cli/discovery.rs",
    "src-tauri/src/cli/mod.rs",
    "src-tauri/src/host/cli/access.rs",
    "src-tauri/tests/cli_content.rs",
    "src-tauri/tests/cli_discovery.rs",
    "spec/src/history/E-CLI-009.md",
    "spec/src/current/desktop.md",
    "spec/src/navigation/history-01.md"
  ],
  "versions": {
    "node": "26.8.2",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "serverPin": "83fca8ddd25b7b7913723e231779862f94f7dbcb",
    "specValidator": "0.2.1",
    "sourceCliCommit": "11fdd71285fb64e598fd1f52a853f35416955c23",
    "aiArchiveSha256": "071f885c9c0b4efe0722bd3771a632583a7416d62a59f17d2c9f3d9ac9ea3630"
  },
  "contractReview": "Desktop mounts shared HTTP and MCP over one boundary and Core grants. Explicit native credential export selects private secret-free Unix discovery. Local scope, expiry, revocation and vault closure remain authoritative. No remote OAuth or write capability is conferred.",
  "acceptanceReview": "Original exact MCP mount regression returned 404 (one failure). After mounting the shared adapter it passes with credential revocation. Seven listener/export/discovery tests pass. Strict normal Clippy passes. Native dialogs and installed ordinary bundles remain unqualified. No user profile or visual baseline was used. Full native source tests pass 293 with two pre-existing ignored; normal/e2e strict Clippy and e2e native build pass. Docker full check fails Source intake ancestry unavailable or stale; an isolated unchanged-parent checkout reproduces the same failure. Desktop validation tooling owns that separate issue; it is not waived and no release or push is qualified. The complete Docker test lane passes 951 governance/renderer, 748 AI and 293 native cases, zero failures; the same two native quarantines remain ignored. Final evidence audit passes 523 records; spec-first passes eight protected files and two chapters. Documentation-size and missing-navigation findings were corrected without raising limits. Final aggregate spec validation passes after the documentation corrections, then fails at the independently reproduced canonical source-intake ancestry check. Full product tests/build remain passing; aggregate check/spec remain blocking.",
  "runs": [
    {
      "name": "Original MCP regression before fix",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --test cli_content mcp_mount_shares_desktop_grants_and_revocation",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Focused listener, export and discovery after fix",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --test cli_content --test cli_credential --test cli_discovery",
      "result": "pass",
      "passed": 7,
      "failures": 0
    },
    {
      "name": "Strict native Clippy",
      "command": "cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Docker architecture and App ownership with documented private archive",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm check:architecture; LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm check:app-ownership",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Initial Docker setup without required private archive",
      "command": "pnpm check:architecture",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Full native source suite",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked",
      "result": "pass",
      "passed": 293,
      "ignored": 2,
      "failures": 0
    },
    {
      "name": "Strict e2e Clippy",
      "command": "cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --features e2e --locked -- -D warnings",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Native e2e build",
      "command": "cargo build --manifest-path src-tauri/Cargo.toml --locked --features e2e",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Docker full check",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm check",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Unchanged-parent Docker full check reproduces ancestry failure",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=/home/steve/Projects/lapis-desktop/.local/ui025-private-archives.json node scripts/validation.mjs run check (isolated workspace at 54538ca0)",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Full Docker suite using reviewed private archive",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm test",
      "result": "pass",
      "passed": 1992,
      "ignored": 2,
      "failures": 0
    },
    {
      "name": "Initial final specification validation found documentation limits and missing navigation",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm spec:check",
      "result": "fail",
      "failures": 4
    },
    {
      "name": "Docker production renderer build",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm build",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Intermediate documentation validation before final size reductions",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm spec:check",
      "result": "fail",
      "failures": 3
    },
    {
      "name": "Docker final evidence audit",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm check:evidence",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Docker final spec-first gate",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm spec:first",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Final aggregate spec validates documentation then reproduces canonical-intake blocker",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm spec:check",
      "result": "fail",
      "failures": 1
    }
  ],
  "remaining": [
    "Native consent/save dialog and cold ordinary-bundle acceptance remain required.",
    "The separately pinned bundled CLI does not yet include server-source discovery; use the locally built standalone CLI for source acceptance.",
    "Private @lapismd/ai remains an explicit development archive prerequisite.",
    "Windows secure discovery, durable approval across restart, remote OAuth and content mutations/search remain owning-backlog work.",
    "Canonical full check/spec lanes remain blocked by reproduced unchanged-parent source-intake ancestry failure; no release or push is qualified."
  ]
}
```
