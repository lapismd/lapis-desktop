# Prepare existing App Profile cold-chat collection

```json
{
  "id": "E-RETIRE-013",
  "date": "2026-11-18",
  "revision": "enclosing-change",
  "result": "pending",
  "versions": {
    "desktopBase": "2015c1ead2042b6a9f5f8c52e37d205bdd4773b7",
    "serverSource": "83fca8ddd25b7b7913723e231779862f94f7dbcb",
    "node": "24.15.0",
    "pnpm": "10.34.5",
    "specValidator": "0.2.1",
    "dockerImage": "sha256:36d8f2ab59683921ee66ef0f48b3dfa62c921dd958dd1f13342ec765ff6082d4"
  },
  "requirements": ["LD-GOV-002", "LD-AI-002", "LD-AI-004"],
  "files": [
    "scripts/native-family-inventory.json",
    "scripts/native-optional-inventory.json",
    "tests/governance/fixtures/native-headed-files.json",
    "tests/governance/native-families.test.mjs",
    "spec/src/current/governance.md",
    "spec/src/current/native-acceptance.md",
    "spec/src/backlog/ai-qualification.md",
    "spec/src/verification.md",
    "spec/src/navigation/history-02.md",
    "spec/src/history/E-RETIRE-013.md"
  ],
  "contractReview": "Prepare only collection of existing App Profile Core cold-chat acceptance under explicit services/feature/coldProcess=true. Preserve the native test body, helper, dispatcher, artifact schema, family-wide inherited renderer owner, default Docker/Linux exclusions, core services/functions and future Language Service wiring. No native acceptance or frozen-host removal is inferred.",
  "acceptanceReview": "A portable governance regression must first reproduce missing collection and then prove exactly one services feature selection, smoke/services affected mapping, preservation of the separate renderer matrix and no duplicate optional owner. Source checks run in isolated bounded omarchy Docker with individually hash-verified public archives, no shared workspace caches, dirty sibling sources or host product execution. Native behavior remains unexecuted.",
  "provenancePrerequisite": {
    "pin": "lapismd/lapis-server@83fca8ddd25b7b7913723e231779862f94f7dbcb",
    "peerPath": "crates/lapis-app-core/tests/support/native_turn/peer.py",
    "status": "pending native execution prerequisite",
    "detail": "ci-sources declares the exact Server commit and existing portability governance compares it with Cargo.lock. Hosted source preparation selects that commit. nativeTurnFixture still reads the sibling working-tree peer.py at invocation; the acceptance artifact does not freeze or verify its bytes. Independently verify exact clean Server source and peer SHA256 before any separately authorized native execution. This slice does not alter that helper or artifact schema."
  },
  "preservedNativeSources": {
    "tests/desktop/ai-core-chat.test.mjs": "c2f7a2583a1e02981116a14948883a549a0fd876ee26780e55ffbc66211788f2",
    "tests/desktop/native-turn-fixture.mjs": "8525034cbc9cb747131ec9b7ca7ad4227460a65a103ed9ec5ddcfb72aa8e6dc5",
    "tests/desktop/ai-notes-binding.test.mjs": "844502d2fae0bcc237f0f081c1fd764ef454cde54d7ee6e8faf6576b0e92e08d",
    "scripts/desktop-acceptance.mjs": "98101fd3b5dbe9e4fb16d6684c38997c5ae105252d9fea7b43f18e8c8191fc21"
  },
  "runs": [
    {
      "name": "Specification discovery",
      "command": "pnpm spec:search \"App Profile native chat cold collection acceptance\"",
      "result": "fail",
      "failures": 1,
      "detail": "Fresh workspace has no node_modules/spec-validator. Used documented text fallback; no dependencies installed on host."
    },
    {
      "name": "Exact missing-collection regression before",
      "command": "node --test --test-name-pattern=\"Core cold chat is independently collected\" tests/governance/native-families.test.mjs",
      "result": "fail",
      "tests": 1,
      "failures": 1,
      "detail": "Fresh isolated omarchy Docker, Node24.15.0,2CPU/4GiB,no volumes.0pass/1fail: actual native family entry undefined. No native test body executed."
    },
    {
      "name": "Exact missing-collection regression after",
      "command": "node --test --test-name-pattern=\"Core cold chat is independently collected\" tests/governance/native-families.test.mjs",
      "result": "pass",
      "tests": 1,
      "failures": 0,
      "detail": "Same isolated omarchy Node24.15.0 worker:1pass/0fail after inventory-only collection. No native body executed."
    },
    {
      "name": "Dependency-free related governance probe",
      "command": "node --test tests/governance/native-families.test.mjs tests/governance/native-scope-inventory.test.mjs tests/governance/native-fixture-portability.test.mjs",
      "result": "fail",
      "tests": 16,
      "failures": 1,
      "detail": "15portable family/scope cases pass. Fixture-portability module cannot import @lapismd/jj-history because this narrow worker intentionally has no dependency install. Retain initial result and rerun after the isolated runner installs verified archives; not a native product failure."
    },
    {
      "name": "Exact related governance replay after installed cohort",
      "command": "node --test tests/governance/native-families.test.mjs tests/governance/native-scope-inventory.test.mjs tests/governance/native-fixture-portability.test.mjs",
      "result": "pass",
      "tests": 19,
      "failures": 0,
      "detail": "Same exact original command, owning isolated Docker worker after verified archive install:19pass/0fail. The previously unloadable fixture-portability module now executes all four portable mocked-source cases. No actual Server peer/native app/provider is executed."
    },
    {
      "name": "Corrected authoring/report harness attempts",
      "command": "Scratch Prettier3.3.3 formatting and exact-related replay log redirection",
      "result": "fail",
      "failures": 2,
      "detail": "Initial scratch --write reports EACCES for source UID501 files under cap-drop=ALL; print formatted output to new owned files instead. Initial replay redirection used absent /reports; corrected to existing /results before the test command ran. Both corrected attempts pass; exact logs/commands retained under ignored core-chat-collection. No source assertion, native helper, ownership policy or gate was weakened."
    },
    {
      "name": "Pinned discovery and prerequisite verification",
      "command": "npm latest metadata; Docker spec-validator doctor --json and pnpm spec:search; eight archive SHA256/package checks",
      "result": "pass",
      "failures": 0,
      "detail": "Latest Deno-free spec-validator remains0.2.1, already in manifest/lock. Doctor exit0; semantic search explicitly degrades because qmd is absent on Docker PATH. Text fallback only; no semantic-success claim/global repair. All8explicit archives match package names/versions/full digests and owning source receipts."
    },
    {
      "name": "Complete owning source qualification",
      "command": "node scripts/validation.mjs run check:all",
      "result": "pass",
      "failures": 0,
      "detail": "47c6ea44-699c-43da-abc1-22d82f791440, frozen20eeafa04f1f37fcfd15401b31460a695be6e6e0: 811governance/renderer tests;748AI tests across153files;290Rust passes with2existing ignores. Ordinary/e2e strict Clippy, full formatting, types0errors/0warnings, parity116families/0findings, and production renderer build pass. omarchy2CPU/12GiB,6GiB build heap, fresh workspace-owned volumes and verified8package overlay. No host fallback/native WebView/provider. Existing bundle-size warning retained."
    },
    {
      "name": "Canonical specification seal",
      "command": "node scripts/validation.mjs run spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "842cab14-def5-4a47-9770-296a6091df15: all4lanes pass (validate including evidence/source ownership, Rust format, mdBook and spec-first). Isolated omarchy Docker2CPU/4GiB, same verified8package overlay. QMD fallback remains explicit; large mdBook search-index warning is retained. No native product execution."
    }
  ],
  "remaining": [
    "Root review of source-only preparation; no commit or push in this slice until instructed.",
    "Separately authorized native execution with exact verified peer, binary, package and profile identities. Existing local native lanes remain non-qualifying under current hosted/release policy.",
    "App Profile-specific synthetic/original retired installed-copy, legacy preferences, Safe Mode, old settings/controller IDs/conversation/memory bytes and lifecycle/storage/cold-reopen acceptance.",
    "Frozen Deno host removal remains gated; no publication, installed-app replacement or native authorization inferred."
  ]
}
```

Collection and portable governance are separate from native product
qualification. The original Core test creates a fresh conversation; it does not
prove preservation of an old shared-AI installation or its settings and memory.
