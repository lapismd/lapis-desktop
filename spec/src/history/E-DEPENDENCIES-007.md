# Qualify Notes164 private production boundary

```json
{
  "id": "E-DEPENDENCIES-007",
  "date": "2026-11-17",
  "revision": "enclosing-change",
  "result": "blocked",
  "requirements": ["LD-GOV-002", "LD-GOV-003", "LD-GOV-006", "LD-CI-004"],
  "files": [
    "scripts/ci-sources.json",
    "tests/governance/ci-prerequisites.test.mjs",
    "tests/governance/validation-native.test.mjs",
    "tests/governance/profile-build-tool-boundary.test.mjs",
    "spec/src/current/governance.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/backlog.md",
    "spec/src/verification.md",
    "spec/src/navigation/history-02.md",
    "spec/src/history/E-DEPENDENCIES-007.md",
    "docs/proposals/desktop-picomatch-development.md"
  ],
  "contractReview": "Consume the exact source-owned Notes164 six-archive cohort using the existing private migration projection. Preserve portable registry manifest/lock, all other pins and native Notes40b. Prove the public Profile build-helper host-Vite contract and absence of Vite from installed production dependencies. No npm replacement, source shim, gate weakening or HIGH exception activation.",
  "acceptanceReview": "Original main18aac actual hosted artifact and source policy reproduce production HIGH and real failed scheduled health. Only the JS Notes source pin and intentional expected-pin fixtures change. Source pack checksum/identity, all archive hashes, public exports, frozen installed routes, actual installed audit and complete cold consumer lanes are independent proofs. Source proposal remains disabled; native distribution and hosted completion are not inferred.",
  "runs": [
    {
      "name": "Original installed production and aggregate audit",
      "command": "pnpm audit --prod --json; pnpm audit --json; auditFindings(all, production, sourcePolicy)",
      "result": "fail",
      "failures": 2,
      "detail": "Verified original main18aac CI44148165857 artifact14357342947 digest42451e77de61a508d818b416fd7f725cdd7a4ce4757cde2c9c93aff54af92c4c. Actual projection reports production picomatch4.0.7 through AppProfile>Vite and the same aggregate HIGH. Source gate emits2errors; unchanged approvals cover only MODERATE development tooling."
    },
    {
      "name": "Original scheduled health",
      "command": "checkNightlyHealth against read-only GitHub API on2026-11-17T23:01:21Z",
      "result": "fail",
      "failures": 1,
      "detail": "recent-failure: latest full scheduled44067164691 failed; last successful43841592984 is36.6hours old. Existing30/48hour thresholds unchanged. Fix owning gates and obtain genuine successful full schedule; no timing waiver."
    },
    {
      "name": "Exact owning source build/pack and recovery",
      "command": "Notesb3 validation:consumer-pack in pinned owning CI image; docker cp produced cohort; sha256sum all6archives",
      "result": "fail",
      "failures": 1,
      "detail": "Build/pack completed successfully, then worker could not write host-mounted results/result.json (EACCES). Recovered produced cohort read-only from containerf9161fe2ba41165621ccc2df8cf36a0a559f285d829d6c0a899f97ab47bf6951. Every produced archive hash equals immutable owning Notes164 qualification receipt; source package inputs unchanged in later merged5ff. This is not a published npm replacement or a cross-run CI-fanout artifact."
    },
    {
      "name": "Private projection frozen install and public regression",
      "command": "source worker validation:smoke; node --import tsx --test tests/governance/profile-build-tool-boundary.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Actual candidate source4de846ad verifies34 installed archive import routes and smoke Chromium/WebKit.2public Profile tests pass, proving no Vite production/optional/peer dependency and helper works with host Vite. Existing Tasks/AI archives retained byte-for-byte."
    },
    {
      "name": "Local audit diagnostic collection error",
      "command": "cache-only installed-audit helper importing undeclared YAML",
      "result": "fail",
      "failures": 1,
      "detail": "Diagnostic helper initially failed before audit due undeclared YAML import. Replaced only cache helper with source-owned verifyArchiveGraph; no source dependency, node_modules or operational checker changed."
    },
    {
      "name": "Actual installed production repair and unchanged HIGH gate",
      "command": "pnpm audit --prod --json; pnpm audit --json; auditFindings(all, production, sourcePolicy)",
      "result": "fail",
      "failures": 1,
      "detail": "Production HIGH1\u21920 and zero production advisories. Aggregate retains two development HIGH vulnerable versions under GHSA-fc5q-39xc-vjpf; exact policy still blocks one advisory. Existing MODERATE approvals remain unchanged. All installed inputs/hashes recorded; proposal is disabled."
    },
    {
      "name": "Pin fixture failure before expected revision update",
      "command": "node --import tsx --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "fail",
      "failures": 2,
      "detail": "Initial candidate794pass/2fail: only CI-prerequisite/native-validation fixtures intentionally expected old JS Notes01bf. Updated only expected JS pin to actualb3; native Notes40b and semver assertions unchanged."
    },
    {
      "name": "Corrected exact pin fixtures and complete renderer/governance",
      "command": "node --test tests/governance/ci-prerequisites.test.mjs tests/governance/validation-native.test.mjs; node --import tsx --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Exact corrected fixtures pass, then cold final candidate796/796 pass. The new public helper regression is included."
    },
    {
      "name": "Complete AI policy surface",
      "command": "pnpm test:ai",
      "result": "pass",
      "failures": 0,
      "detail": "746tests/152files,0failures against actual private installed cohort."
    },
    {
      "name": "Renderer types",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "detail": "0errors/0warnings against actual private installed cohort."
    },
    {
      "name": "Initial incomplete specification metadata",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "detail": "Checker rejected new backlog paragraph extending400line topic to406 and missing fresh evidence coverage. Move pending paragraph to short backlog index, preserve400line limit and append this complete evidence; final full-image specification verification remains required."
    },
    {
      "name": "Cold renderer and static catalog builds",
      "command": "pnpm build; pnpm build-storybook",
      "result": "pass",
      "failures": 0,
      "detail": "Fresh candidate both builds pass. No source product or visual baseline changed."
    },
    {
      "name": "Full cold catalog in progress",
      "command": "pnpm test:storybook (all4source-owned shards and display variants)",
      "result": "pending",
      "failures": 0,
      "detail": "Running in retained immutable source4de846ad container. Later changes only add evidence/proposal/backlog metadata, not runtime or dependency inputs. Final counts must be appended before qualification."
    },
    {
      "name": "Moved backlog link regression",
      "command": "pnpm exec spec-validator validate",
      "result": "fail",
      "failures": 1,
      "detail": "Moving the pending paragraph from backlog/distribution.md to backlog.md retained one obsolete ../current relative link. Corrected to current/local-dependencies.md; full400line limits remain unchanged."
    },
    {
      "name": "Full-image validation respects running catalog lease",
      "command": "node cache/run-desktop-notes164-full.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "Full-image attempt refused before snapshot/installation because the active catalog owns the same workspace lease. Lease preserved; no parallel bypass, cancellation or duplicate long suite. Full check/test/build/spec/evidence remain pending."
    },
    {
      "name": "First full catalog display group",
      "command": "pnpm test:storybook --shard=1/4 (desktop/light group within complete source runner)",
      "result": "pass",
      "failures": 0,
      "detail": "29files/127tests pass in cold actual installed candidate. Complete runner continues narrow/light and remaining dark groups and shards; this subgroup does not qualify the entire catalog."
    },
    {
      "name": "Evidence and source-range metadata",
      "command": "node scripts/evidence.mjs; spec-validator first --base18aac; spec-validator validate",
      "result": "pass",
      "failures": 0,
      "detail": "507evidence records pass,5protected files/2canonical chapters pass,569chapters/134requirements validate after corrected backlog link. Host node_modules still resolves CLI0.2.0 despite committed^0.2.1 and exactlock0.2.1, so this is metadata diagnostic only; explicit0.2.1 CLI replay and frozen full-image checks remain qualification gates. No portable dependency or lock change is needed."
    },
    {
      "name": "Explicit latest Deno-free CLI metadata replay",
      "command": "pnpm dlx @lapismd/spec-validator@0.2.1 validate; pnpm dlx @lapismd/spec-validator@0.2.1 first --base18aac2800dcc69ea50b1e78b242b95c667af0447",
      "result": "pass",
      "failures": 0,
      "detail": "Latest committed Deno-free0.2.1 CLI:7validators/569chapters/134requirements validate and5protected files/2canonical chapters pass source-range gate. Complete frozen full-image spec/check/evidence remains pending; this is not native consumer qualification."
    }
  ],
  "remaining": [
    "Development HIGH GHSA-fc5q-39xc-vjpf on the two exact proposed tooling paths remains blocking; no HIGH approval exists in the Desktop source policy.",
    "Updated hosted private-cohort build, exact candidate/main checks and full successful scheduled validation remain required.",
    "Central dependency-adoption57 archive hold and activation/replay remain pending; this source slice does not clear them.",
    "Native installed application/distribution acceptance is separate and is not qualified by portable/browser lanes.",
    "Complete cold full catalog, full-image native normal/e2e Clippy, Rust tests, complete specification/evidence and formatter remain required. Source PR stays draft and held."
  ],
  "versions": {
    "parent": "18aac2800dcc69ea50b1e78b242b95c667af0447",
    "consumerValidationSnapshot": "4de846ada8579c9661368d3bf5cefb578af41c91",
    "notesSource": "b3a93b2f5e49d514a6c447a0d6e2664d3179bb3e",
    "node": "24.15.0",
    "pnpm": "10.34.5",
    "specValidator": "0.2.1",
    "notesBuildImage": "sha256:a4ffd16112f050b63d0e53c22ce7f6e8790872c0cdcfb2d8c85d5a6df0bc8345",
    "uiImage": "sha256:4a9a5a5be3d78e5720d2702eafca56c2349bd3288ba494405d6cc31345b63e1e",
    "fullImage": "sha256:36d8f2ab59683921ee66ef0f48b3dfa62c921dd958dd1f13342ec765ff6082d4"
  },
  "archiveQualification": {
    "notesArchives": [
      {
        "name": "@lapis-notes/api",
        "version": "0.6.8",
        "path": "package-1.tgz",
        "sha256": "c90eac5de04eb15b971d45665f0bd26603abf3a00fd35320a9ed3cb56dc0f4ce",
        "sourceRepository": "lapismd/lapis-notes",
        "sourceCommit": "b3a93b2f5e49d514a6c447a0d6e2664d3179bb3e"
      },
      {
        "name": "@lapis-notes/ui",
        "version": "0.2.3",
        "path": "package-2.tgz",
        "sha256": "d8dc5f8e2469f2e9f4dd5bcd5b727db9780507caa5a8701f3c8a9d32f9a32e95",
        "sourceRepository": "lapismd/lapis-notes",
        "sourceCommit": "b3a93b2f5e49d514a6c447a0d6e2664d3179bb3e"
      },
      {
        "name": "@lapis-notes/workspace",
        "version": "0.4.8",
        "path": "package-3.tgz",
        "sha256": "558ecb749a420cbb222a790f19f5527aef9b2d956fcb367e633ca26cc7d60177",
        "sourceRepository": "lapismd/lapis-notes",
        "sourceCommit": "b3a93b2f5e49d514a6c447a0d6e2664d3179bb3e"
      },
      {
        "name": "@lapis-notes/file-explorer",
        "version": "0.2.8",
        "path": "package-4.tgz",
        "sha256": "5ab4ba28eb6a839bf64cfbc4031c77bb60b9883069ce9c0a510ecce32be3f342",
        "sourceRepository": "lapismd/lapis-notes",
        "sourceCommit": "b3a93b2f5e49d514a6c447a0d6e2664d3179bb3e"
      },
      {
        "name": "@lapis-notes/language-service",
        "version": "0.1.6",
        "path": "package-5.tgz",
        "sha256": "9b371f7c14850d73961f9d2a94aad126c964b7f3800576b38079185e821f28a0",
        "sourceRepository": "lapismd/lapis-notes",
        "sourceCommit": "b3a93b2f5e49d514a6c447a0d6e2664d3179bb3e"
      },
      {
        "name": "@lapis-notes/app-profile",
        "version": "0.2.5",
        "path": "package-6.tgz",
        "sha256": "82f533715b31a0504f4ce3e9780b9071a8c00bcfb1f9c929c5deff46a0e1d859",
        "sourceRepository": "lapismd/lapis-notes",
        "sourceCommit": "b3a93b2f5e49d514a6c447a0d6e2664d3179bb3e"
      }
    ],
    "installedLockSha256": "c3557d11aff1162073ec6fcf7f086695644ff378e224e1e2e5aa54cd0b4371d2",
    "projectedManifestSha256": "5560247406fbf41e9b336fddb494622a4318056f919df72eb483a7c29a7431cf",
    "portableLockSha256": "45718cc76b2a5f086773affa62b1dc674be73c3954c8a76f9601f54a801a58ef",
    "manifestSha256": "67ff70bdb0437f2339cf3d3ef7294dbea4d8c0226461d54d7c58150167c64850",
    "ciSourcesSha256": "cd82614d26a3e685f0930c2f16d94c3c53cf49313abcc5daf22e7c1c8789d86c"
  }
}
```
