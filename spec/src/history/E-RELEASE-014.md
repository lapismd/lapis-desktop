# Main queue readiness and Rust backup quarantine

```json
{
  "id": "E-RELEASE-014",
  "date": "2026-11-01",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": [
    "LD-AI-005",
    "LD-AI-007",
    "LD-REPO-001",
    "LD-REPO-002",
    "LD-REPO-005",
    "LD-DESK-005",
    "LD-REL-002"
  ],
  "files": [
    "src-tauri/tests/repository_original.rs",
    "tests/desktop/ai-native-queue-owner.test.mjs",
    "spec/src/current/desktop.md",
    "spec/src/current/repository.md",
    "spec/src/current/vault-backup.md",
    "spec/src/current/ai.md",
    "spec/src/current/ai-queue.md",
    "spec/src/current/native-acceptance.md",
    "spec/src/current/distribution.md",
    "spec/src/backlog/distribution.md",
    "spec/src/verification.md",
    "spec/src/navigation/history-02.md"
  ],
  "contractReview": "Main deac2b39431cf5437f8bbe7ccf0cd790ea752f32 push41355656024 failed Unit124995048827 and NativeARM64124995048706. JJ diff proves its tree identical to PR8 head68d3192550112d3e0dcfb6f95c31f0a64801084b, whose full CI41353184371 passed all17jobs. Rust original_and_managed_reads_share_one_client_without_initializing_original_history failed atrepository_original.rs:51 on app.start_backup with sanitized Io/Automatic vault backup is unavailable; preceding PRjob124987627923 passed the case and264Rust tests with2existing subprocess-helper ignores. Native queue-owner/cold-recovery failed after15741.312416ms at initialnative-session.mjs:124 rendererReady acknowledgement, before driver/queue evaluation; PRjob124987628056 passed it in9998.65025ms. Product,cohort,helpers and assertions match.",
  "acceptanceReview": "Existing maintainer RC instruction authorizes narrow documented quarantine. Ignore only the exact Rust case on cfg(all(target_os=macos,target_arch=aarch64)); Linux retains it. Skip only the exact native queue-owner case, retaining its full callback,180000ms case timeout,30000ms operation waits and shared15000ms readiness deadline.21nativeUIquarantines:1startup+20feature;one additional macOSARM64Rustquarantine. TwoexistingRusthelper ignoresunchanged. Exact causes are unproven: backup error sanitization covers multiple initialization failures; native log reaches frontend hooks but has no Rust rendererReady marker. No accepted queue work is inferred from the failed first launch. Both complete source-independence/backup and queue-control/cold-recovery/no-replay boundaries remain unqualified. No product,dependency,publicAPI or deadline changes.",
  "runs": [
    {
      "name": "PR8 full CI all17pass;Unit633Node/746AIpolicy/264Rustpass,2helper ignores;native feature90pass/19skip,startup2pass/1skip,resources2pass/0skip. Both exact cases pass.",
      "command": "CI run41353184371 (Unit124987627923,Native124987628056)",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Main Unit633Node/746AIpolicy pass;repository_original group3pass/1fail. Native startup2pass/1skip;feature89pass/1fail/19skip;laterresourcefamily notrun. Other12directgatespass;Validate/Fullsourcefaildownstream.",
      "command": "CI run41355656024 (Unit124995048827,Native124995048706)",
      "result": "fail",
      "failures": 2
    },
    {
      "name": "Native failure artifact13103794363 downloaded and ZIP SHA256 verified: b81ef5ac13235e031cbd63967fefbc0b2971d91e6cb2339351a16075a1808e64. Queue-owner log contains frontend initialization but no rendererReady marker. No cold queue launch occurred.",
      "command": "GitHub artifact download and Python hashlib/zipfile verification",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Before quarantine: exact Rust case passes1/1 on native macOSARM64 isolated temp fixtures; this is not Docker CI parity.",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --test repository_original original_and_managed_reads_share_one_client_without_initializing_original_history -- --exact --nocapture",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Before quarantine:10controlled unchanged-source parallel-group attempts,all4cases pass each time (40totalpasses,0failures). Every attempt retained in main-deac-original-parallel-reproduction.log. The hosted initialization error remains unreproduced.",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --test repository_original -- --nocapture (10bounded controlled attempts)",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Exact native registration:0passes,0failures,1explicit skip; no application launch or native coverage claimed.",
      "command": "node --test --test-name-pattern='^native queue preserves exact admitted capture, Stop/cancel/resume and cold paused recovery without replay$' tests/desktop/ai-native-queue-owner.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Native callback/options,completeRustfile except exact conditionalignore,sharedhelpers and13priorrelease receipts intact. Candidate LIMITATIONS includes both gaps.",
      "command": "node --input-type=module (TypeScript callback/options AST,Rust-byte,helper/receipt and LIMITATIONS assertions againstdeac2b39)",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "After quarantine:MacARM64 repository_original group3pass/0fail/1explicitignore. Compiler targetcfg confirmsignore active onlyMacARM64 and inactiveLinuxARM64/x64 or IntelMac.",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --test repository_original -- --nocapture; rustc --print cfg --target <four target triples>",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Complete governance248passed,0failed/0skipped.",
      "command": "node --import tsx --test tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "First Docker specification attempt could not start:local Docker daemon socket absent. No specification lane or Docker parity claimed; no host fallback.",
      "command": "LAPIS_DESKTOP_BASE=deac2b39431cf5437f8bbe7ccf0cd790ea752f32 LAPIS_DESKTOP_HEAD=@ pnpm spec:check",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "After starting Docker Desktop and verifying API aarch64:all4Docker specification lanes pass(validate,rust-format,mdbook,spec-first). Changed-file Prettier and cargo fmt checks pass.",
      "command": "docker desktop start --detach --timeout 50; LAPIS_DESKTOP_BASE=deac2b39431cf5437f8bbe7ccf0cd790ea752f32 LAPIS_DESKTOP_HEAD=@ pnpm spec:check; pnpm exec prettier --check <changed files>; cargo fmt --manifest-path src-tauri/Cargo.toml --check",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Docker immutable evidence passes398records.",
      "command": "LAPIS_DESKTOP_BASE=deac2b39431cf5437f8bbe7ccf0cd790ea752f32 LAPIS_DESKTOP_HEAD=@ pnpm check:evidence",
      "result": "pass",
      "failures": 0
    }
  ],
  "versions": {
    "node": "24.10.0",
    "hostedNode": "24.22.1"
  },
  "remaining": [
    "Local checks pass:0pass/1native skip,3Rustpass/1MacARM64conditionalignore,targetcfgscope,callback/function/helper/13receipt preservation,248governance,4Docker specification lanes,398Docker evidence records and formatting. Neither skipped original case is qualified; final-head hosted and latest exact-main full CI remain pending.",
    "Owners: Desktop native automation for renderer readiness; Desktop/Core backup integration for Rust startup. Diagnose each cause,retain failed attempts,and re-enable the exact original cases only after reliable hosted full-family passes with assertions/deadlines intact.",
    "Full latest exact-main CI and ordinary three-platform Homebrew qualification remain required before publication approval. No release/tag published."
  ]
}
```
