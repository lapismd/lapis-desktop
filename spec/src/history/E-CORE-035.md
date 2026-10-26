# Shared Core Repository reader intake

```json
{
  "id": "E-CORE-035",
  "date": "2026-10-27",
  "revision": "enclosing-change",
  "result": "pending",
  "tasks": ["M16.8"],
  "requirements": [
    "LD-REPO-001",
    "LD-REPO-002",
    "LD-REPO-004",
    "LD-REPO-005",
    "LD-CAT-003"
  ],
  "contractReview": "Reuse Core source discovery/read frames and its existing worker; attach a separate reader client to the admitted VaultService. Preserve lossless frames, current App writers and the native mutation/working-copy boundaries.",
  "milestoneReview": "M16.8 In progress. Core bridge/dedicated reader lifetime implemented against source-qualified Notes0ff. Exact2/affected161 renderer and11governance cases, source audit/types,4Original/managed service cases and normal/e2e strict host checks pass. Original actual-native and composed Tasks/catalog gates remain pending.",
  "versions": {
    "desktopParent": "0dbf23070eba6ba4975a1581cf60e1ab46eb4258",
    "nativeNotesCandidate": "0ff929b1fe53a790c1cd4af777d4e9879e46e15f",
    "nativeSourceQualification": "Root receipt823317ad passed586Rust/2414package/263coldcatalog/26ordinarybrowser and78governance; final Desktop gate separate",
    "publicAPI": "419b47c5b7857cb9e2106aacf519671deba7d34bb79f364f642a378c4db094b9",
    "publicHistory": "e714935f9f0a9365f74aaeca3aa67f8b0fef089e95ef107d24eabe915710b028"
  },
  "files": [
    "MIGRATION.md",
    "scripts/source-audit.mjs",
    "scripts/validation/native-sources.json",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository.md",
    "spec/src/history/E-CORE-035.md",
    "spec/src/history/core/index.md",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/host/repository/commands.rs",
    "src-tauri/src/host/repository/mod.rs",
    "src-tauri/src/host/repository/policy.rs",
    "src-tauri/src/host/repository/policy/tests.rs",
    "src-tauri/src/host/repository/reader.rs",
    "src-tauri/src/host/repository/sources.rs",
    "src-tauri/src/host/repository/storage.rs",
    "src-tauri/src/repository/mod.rs",
    "src-tauri/src/repository/original.rs",
    "src-tauri/src/repository/readers.rs",
    "src-tauri/tests/repository_original.rs",
    "src-tauri/tests/repository_original/fixture.rs",
    "src/lib/native/repository/history-client.ts",
    "src/lib/native/repository/services.ts",
    "tests/desktop/repository-admission.test.mjs",
    "tests/desktop/repository-driver.mjs",
    "tests/governance/source-audit.test.mjs",
    "tests/renderer/repository-core-read.test.mjs",
    "tests/renderer/repository-sources.test.mjs"
  ],
  "remaining": [
    "Dedicated Original/managed service tests and strict host compilation",
    "Cold retained native UI, source preservation, blocked-close and reload/restart proof",
    "Composed Tasks/source/public/catalog/native qualification"
  ],
  "runs": [
    {
      "name": "Exact Core bridge regression before implementation",
      "command": "node --import tsx --test tests/renderer/repository-core-read.test.mjs",
      "result": "fail",
      "tests": 2,
      "failures": 2
    },
    {
      "name": "Exact Core bridge after implementation; Docker620d6b0c",
      "command": "node --import tsx --test tests/renderer/repository-core-read.test.mjs",
      "result": "pass",
      "tests": 2,
      "failures": 0
    },
    {
      "name": "Affected Repository/History/Backup renderer families; Dockercf984d72",
      "command": "node --import tsx --test tests/renderer/{repository,backup,history,native-history}*.test.mjs",
      "result": "pass",
      "tests": 161,
      "failures": 0
    },
    {
      "name": "Source audit after affected renderer pass; Dockercf984d72",
      "command": "node scripts/source-audit.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "Native test helper exceeded300 counted lines; split fixture before retry"
    },
    {
      "name": "Transport attempts0784d7f3/7abb87cc",
      "result": "fail",
      "tests": 0,
      "detail": "Infrastructure-only: SSH port22 refused before container creation; zero product tests; no fallback",
      "command": "frozen worker SSH create",
      "failures": 1
    },
    {
      "name": "Affected retry after test fixture split; Dockerbe0d73ef",
      "command": "reader-affected frozen worker",
      "result": "pass",
      "tests": 172,
      "failures": 0,
      "detail": "161 repository renderer plus11 source governance; source audit and types pass0errors/0warnings"
    },
    {
      "name": "Dedicated service first compile; Dockerb851e0d3",
      "command": "pnpm test:rust -- --test repository_original",
      "result": "fail",
      "tests": 0,
      "failures": 2,
      "detail": "Test split omitted HistoryMethod import; corrected before exact retry"
    },
    {
      "name": "Dedicated Core reader service and normal/e2e strict hosts; Dockerb4052b7c",
      "command": "pnpm test:rust -- --test repository_original; pnpm check:rust; pnpm check:rust:e2e",
      "result": "pass",
      "tests": 4,
      "failures": 0
    },
    {
      "name": "Checkpoint document cohorts d98f67dc/da559003",
      "command": "final-docs frozen worker",
      "result": "fail",
      "failures": 4,
      "detail": "First attempt found3 formatting repairs plus unchanged acceptedE-AI-109; second exposed invalid infrastructure-result label in new evidence. Both corrected before retry; original failures retained"
    },
    {
      "name": "Checkpoint spec mapping6117b8bc/b9ae24b5",
      "command": "final-docs frozen worker",
      "result": "fail",
      "failures": 3,
      "detail": "Progress record fields corrected; spec-first requires Desktop/governance/migration chapter updates, now recorded. No product regression waived"
    }
  ]
}
```

Exact before receipt `8983fa08-f8d8-44c0-abfa-d9a22ce3a896` executes both cases
and fails2/2 at the existing plugin transport, without setup errors. The public
SDK remains unchanged; the adapter must preserve full-width values and
structured diagnostics while routing both sources to Core.
