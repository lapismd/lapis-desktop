# Bounded Desktop dependency intake and disabled projected audit decision

```json
{
  "id": "E-DEPENDENCIES-009",
  "date": "2026-11-18",
  "revision": "enclosing-change",
  "result": "blocked",
  "requirements": [
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-006",
    "LD-GOV-008",
    "LD-CI-004"
  ],
  "files": [
    ".github/dependency-automation/canonical-intake.json",
    ".github/workflows/ci.yml",
    ".github/dependency-automation/development-high-proposal.json",
    "docs/proposals/desktop-picomatch-development.md",
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "scripts/ci-audit.mjs",
    "scripts/ci-install.mjs",
    "scripts/ci/commands.mjs",
    "scripts/dependency-automation/check-canonical-intake.mjs",
    "scripts/dependency-automation/maintenance-note.mjs",
    "scripts/dependency-automation/projected-audit-admission.mjs",
    "scripts/dependency-automation/projected-audit-context.mjs",
    "scripts/dependency-automation/source-intake-reader.mjs",
    "scripts/validation/lanes.json",
    "spec-validator.config.mjs",
    "spec/src/backlog.md",
    "spec/src/current/ci.md",
    "spec/src/current/governance.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/history/E-DEPENDENCIES-009.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md",
    "tests/fixtures/desktop-audit-full.json",
    "tests/fixtures/desktop-audit-production.json",
    "tests/fixtures/desktop-validator-intake.json.gz",
    "tests/governance/dependency-automation-intake.test.mjs",
    "tests/governance/projected-audit-admission.test.mjs",
    "tests/governance/projected-audit-context.test.mjs"
  ],
  "contractReview": "Adopt only exact Deno-free SDK0.2 development metadata and two existing mapped factual slots; retain private CalVer/Tauri recipe and all portable runtime/native/archive inputs. Preserve complete raw installed audit and existing MODERATE semantics; add only disabled exact explicit-user projected HIGH capability. No HIGH approval, synthetic npm bytes, consumer shim, broad migration, publication or activation.",
  "acceptanceReview": "Controlled actual pnpm-generated releasedSDK0-to1 pair, reviewed immutable shared file preparer, repeats and independent source guard qualify the bounded contract. Exact unchanged-runtime-manifest frozen/native updater failures remain separate blocker; original8archive2168cold/native acceptance remains E-DEPENDENCIES-008. Current new pipeline still requires full current-source check/test/spec evidence and fresh hosted acceptance.",
  "versions": {
    "node": "24.15.0",
    "pnpm": "10.34.5",
    "specValidator": "0.2.1",
    "reviewedPreparer": "de66d4e332f53e880d4343017dfe4e6b530d9fe0",
    "controlledBefore": "0.2.0",
    "controlledAfter": "0.2.1",
    "implementationSnapshot": "280441d95f2758fe8d2bde1d6a6e297c72d068e9",
    "implementationPackSha256": "8cb54bb8ec63222cb314d78df29695f7396cbb7555ba90986c08866e8180298d",
    "installedLockSha256": "4f3e4309ca81e008ec0f2c8d68f48225206324e8167a1e12f72efe74ab716671",
    "fullImage": "sha256:36d8f2ab59683921ee66ef0f48b3dfa62c921dd958dd1f13342ec765ff6082d4"
  },
  "runs": [
    {
      "name": "Original missing independent source acceptance",
      "command": "node --test tests/governance/dependency-automation-intake.test.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "Exact target initially fails missing owning guard module; source has only the older specification bot exemption and no canonical opt-in."
    },
    {
      "name": "First source parser integration",
      "command": "node --test tests/governance/dependency-automation-intake.test.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "Initial strict note parser export names did not match owning adapter; correct only owning source imports/exports. Same target then passes21cases."
    },
    {
      "name": "Required unmodified-runtime frozen bot boundary",
      "command": "pnpm install --frozen-lockfile --ignore-scripts --ignore-pnpmfile",
      "result": "fail",
      "failures": 1,
      "detail": "Actual isolated root retains all runtime ranges: ERR_PNPM_OUTDATED_LOCKFILE because privateAI and Tasks are absent from portable lock. No ignore or nonfrozen retry qualifies this gate."
    },
    {
      "name": "Actual unmodified-runtime SDK native update",
      "command": "pnpm update @lapismd/spec-validator@0.2.1 --lockfile-only --ignore-scripts --ignore-pnpmfile",
      "result": "fail",
      "failures": 1,
      "detail": "Public npm404 for unpublished@lapismd/ai. No runtime range or package is removed in this reproduction. Private bot path remains held."
    },
    {
      "name": "Controlled public SDK lock generation",
      "command": "pnpm install --lockfile-only --ignore-scripts --offline in explicitly isolated portable registry projection",
      "result": "pass",
      "failures": 0,
      "detail": "Only during controlled resolution omit the two packages intentionally absent from portablelock (AI/Tasks), preserve their real root ranges in source and fixture. Output differs only selected SDK exactspecifier/override. Actual released0.2.0 and0.2.1 are used; no future version. First trial omittedAI only and added publishedTasks graph; reject that broader output, reset to original lock and regenerate matching original two-package omission."
    },
    {
      "name": "Actual reviewed shared preparer and repeat controls",
      "command": "cache/desktop-prepare-canonical-proof.mjs invoking prepareCanonicalFiles atde66d4e3",
      "result": "pass",
      "failures": 0,
      "detail": "Controlled realGit/JJ baselinea689dc936d75106f9d1efe231382a6039d7defb3 contains actualSDK0portablefixture. Actual file prep0to1 and repeated outputs are byte-identical; independent guard passes. Normal no-intent writer returnsnull. Forcedempty first refuses absentChangesets onboarding ascorrect; optionalnote syntax control uses fixture-onlyconfig removedbeforeprep, actualnote+repeat andguardpass. No source Changesets recipe/config added; versionstatus N/A,emptyflagfalse."
    },
    {
      "name": "Exact projected HIGH positive control authoring",
      "command": "node --test tests/governance/ci-audit.test.mjs tests/governance/projected-audit-admission.test.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "Synthetic nonoperational exact positive decision exposed schema helper mutating its expected-key list; fix copying list before sorting. Raw evidence and actualpolicy unchanged. Corrected controls pass; synthetic decision is not approval."
    },
    {
      "name": "Source pipeline route control authoring",
      "command": "node --test tests/governance/dependency-automation-intake.test.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "A brittle source-string assertion changed underPrettier; use actual exported qualityCommands result to verify the always-on functional invocation. No production behavior or requirement weakened."
    },
    {
      "name": "Current complete focused controls",
      "command": "node --test tests/governance/dependency-automation-intake.test.mjs tests/governance/projected-audit-admission.test.mjs tests/governance/projected-audit-context.test.mjs tests/governance/ci-audit.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Final own-source focused controls pass80cases; later three strict raw-shape/disabled-proposal controls pass with53audit/contextcases and30intakecases total83. Owning offline guard and architecture pass. Full worker uses lockedSDK0.2.1 independently of stale host installation."
    },
    {
      "name": "Current full-image owning source validation",
      "command": "pnpm check; pnpm test; pnpm build; pnpm spec:check; pnpm check:evidence",
      "result": "pass",
      "failures": 0,
      "detail": "Corrected immutable full-image snapshot passes frozen preparation34routes,2publicProfile controls,prod0 collection withHIGHstillblocked,fullcheck (including normal/e2eClippy),874Node tests/746AI cases/290LinuxRust0fail2unchangedignores and rendererbuild. Specification/evidence final metadata replay follows the explicit new fixture mapping; no native headed/macOS acceptance inferred."
    },
    {
      "name": "First current full source formatter boundary",
      "command": "pnpm check",
      "result": "fail",
      "failures": 3,
      "detail": "Independent canonicalguard, parity116families,7validator/571chapter/134requirement specvalidation, types0/0 and normal/e2e strictClippy pass; formatter flags only governance and two rawJSONfixtures. Format owning files without dropping facts (Gov392lines/32185bytes), preserve original audit objects and reset no baseline. Remaining complete lanes must run on corrected immutable snapshot."
    },
    {
      "name": "Existing selected CI planning and bot-policy controls",
      "command": "node --test tests/governance/ci-selection-commands.test.mjs tests/governance/ci-selection-workflow.test.mjs tests/governance/ci-bot-docs.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Actual source quality command list and existing selected/workflow/bot exemption contracts pass; independent canonical check remains outside exemption."
    },
    {
      "name": "Workflow syntax and source architecture",
      "command": "actionlint .github/workflows/ci.yml in existing immutable tool image; node scripts/source-audit.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Read-only actionlint container with no network or credentials passes; all source boundaries pass. No baseline/cap exemptions added."
    },
    {
      "name": "Latest Deno-free tool discovery",
      "command": "pnpm --package=@lapismd/spec-validator@0.2.1 dlx spec-validator doctor; spec-validator search --semantic query",
      "result": "pass",
      "failures": 0,
      "detail": "Actual latestCLI doctor reports13passes and one intentional portable-script-alias warning (exit2 for warning), preserving existing Docker wrappers. QMD semantic search passes. Skill-recommended extra -- separator initially returnsunknownargument; actual existing alias syntax without that separator passes; no source wrapper or SDK patch is added."
    },
    {
      "name": "Current explicit source-fixture mapping failure",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 3,
      "detail": "Validate, independent functional canonical lane, Rustformat and mdBook pass. Spec-first correctly rejects three newly owned audit/SDK fixtures without chapter mapping. Add only their exact filename family mapped to existing governance/localintake owners; retain unknown-fixture rejection and all400line budgets. Replay original fullspec target and evidence."
    },
    {
      "name": "Corrected complete specification and evidence replay",
      "command": "LAPIS_DESKTOP_BASE=18aac2800dcc69ea50b1e78b242b95c667af0447 pnpm spec:check; pnpm check:evidence (defaultDocker/privatearchives)",
      "result": "pass",
      "failures": 0,
      "detail": "All5 specification lanes pass including independent functional guard, mdBook, Rustformat and complete actualbase spec-first.509 evidence records pass. All13 projected-audit source-input bytes match the full check/test/build snapshot exactly; only explicit mapping/append-only evidence changed afterwards. Required HIGH staysblocked; no archive/writehold is removed."
    }
  ],
  "remaining": [
    "No Desktop-specific HIGH approval; source policy still blocks rawHIGH2 while production0. Final coherent source/installed/hosted bindings remain required before any operator question.",
    "Original-manifest shared bot install/update cannot run against missing privateAI/Tasks portablelock/publicAI; source publication or a reviewed shared projection contract remains required.",
    "Reviewed source registration/pinned metadata observer, fresh current-source hostedCI/main/scheduled health, parent central hold/removal and activation/replay remain independent.",
    "Native headed/macOS/distribution and visual approval remain unchanged separate scopes."
  ]
}
```

Source versions, native pins, all8archive identities and every baseline stay
unchanged. Governance remains within400physical lines by removing paragraph
separators only; no normative text, owner mapping or requirement is deleted.
Public runtime registry ranges remain intact. The new optional empty-note parser
does not onboard a Changesets recipe or request forced empty notes in this
private app.
