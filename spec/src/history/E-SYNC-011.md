# Verify dependency and native fixture artifact roles

```json
{
  "id": "E-SYNC-011",
  "date": "2026-11-16",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-CI-002", "LD-GOV-003", "LD-GOV-006", "LD-GOV-008"],
  "contractReview": "Private dependency installation and native Tasks fixtures retain separate admitted roles with unique package names per role. Installers select exactly one verified dependency regardless of inventory order. Unknown roles, duplicate identities, changed source/provenance/hash/projection remain refused.",
  "acceptanceReview": "Both source PRs pass planning, governance and private package preparation, then fail in reused-artifact verification before product suites execute. Reproduce exact Duplicate dependency artifact boundary with real packed Tasks dependency and native fixture; fix owning producer/verifier/consumer and retain all integrity checks.",
  "versions": {
    "foundation": "3b434932e558556b79f7a4f9b1777cfc4b72ffb0",
    "nativeScopes": "aa82a6a538a4743625dc6f1cd506ca2d49f5a6a5",
    "hosted39": "43811392290",
    "hosted40": "43811588044",
    "refreshedMain": "04560f8a2a96097578944189bcff0dc8fe2ae5db"
  },
  "files": [
    "scripts/ci-dependency-artifact.mjs",
    "scripts/ci-install.mjs",
    "tests/governance/ci-artifacts.test.mjs",
    "spec/src/current/ci.md",
    "spec/src/current/governance.md",
    "spec/src/navigation/history-02.md",
    "spec/src/history/E-SYNC-011.md",
    "spec/src/verification.md"
  ],
  "runs": [
    {
      "name": "Hosted reuse boundary refuses distinct Tasks artifact purposes",
      "command": "GitHub CI PR39 run43811392290 and PR40 run43811588044",
      "result": "fail",
      "failures": 12,
      "detail": "Each run has12failed downstream/aggregate jobs;10direct consumers stop at Duplicate dependency artifact before product qualification. Plan, tools, governance, both private package platforms and prerequisite aggregation pass. Prepared payload includes Tasks as a projected dependency and a separately tagged native-fixture, both pinned to7e25dc5c. No package hash/provenance check is waived."
    },
    {
      "name": "Exact real packed-artifact reuse regression before repair",
      "command": "pnpm validation -- run validation:check -- tests/governance/ci-artifacts.test.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "Reportdd296134-f183-4dd3-8e2f-26152f6df0fa:98pass/1fail/0skipped of99; exact existing relocation/provenance test now includes the active Tasks dependency plus native fixture; fails at the same Duplicate dependency artifact assertion. Retain original source/hash/projection/retry checks and add role/order/duplicate/unknown-role refusal coverage."
    },
    {
      "name": "Exact artifact producer verifier and role-specific consumption after repair",
      "command": "pnpm validation -- run validation:check -- tests/governance/ci-artifacts.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Reportf2a2f680-bc62-48be-994c-ed069b18d91c:99pass/0fail/0skipped. Real packed Tasks dependency plus native fixture relocate and verify; installer selection remains dependency-only when inventory is reversed. Duplicate dependency and duplicate fixture roles, missing/ambiguous dependencies and unknown/foreign fixture roles reject. Legacy unroled dependencies normalize explicitly. Original provenance/attempt/source/hash/lock checks remain exercised."
    },
    {
      "name": "Complete source check preserves verification chapter byte budget",
      "command": "pnpm check",
      "result": "fail",
      "failures": 1,
      "detail": "Reportcd858fff-7a9e-4f5f-af6c-f8f2724ceba3:verification.md32789bytes exceeds32768. Shorten only the new evidence summary while retaining its receipt link,99/99count and pending CI; no limits, requirements or historical evidence removed. Final role schema also rejects explicit null/non-string role values; only absent legacy role normalizes to dependency."
    },
    {
      "name": "Final exact role schema and integrity regression",
      "command": "pnpm validation -- run validation:check -- tests/governance/ci-artifacts.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Report56ca31e3-1990-4f66-a651-fd3e7ee72cef:99pass/0fail/0skipped, including explicit null/non-string role refusals; only absent legacy role defaults to dependency. Same real packed dependency/fixture pair and original integrity assertions."
    },
    {
      "name": "Complete local source qualification for artifact reuse repair",
      "command": "pnpm check; pnpm test; pnpm build; pnpm spec:check; pnpm build-storybook",
      "result": "pass",
      "failures": 0,
      "detail": "Reports95fa8286-2f3d-4821-8d4c-3041984c1937(check),1bcc9e0c-1a5c-412f-a768-f79e825ab0cd(test),3ce37df8-f41b-4941-ad47-fdca93effce7(build),201471d2-5cb8-408c-a2fb-329b54adf032(spec),95fe1ffa-da4b-4a1c-9e71-efa764a482f5(static):all pass.786Node,746AIpolicy and281Rust passes;two existing invoked helper ignores remain. Runtime/renderer/catalog/dependency bytes unchanged from E009; retain its2168source-equivalent catalog coverage without claiming a new local full run. Hosted matrix must freshly prove actual prepared-artifact reuse before merge."
    }
  ],
  "remaining": [
    "Integrate current main release workflow/metadata without rewriting qualified hashes, validate that affected boundary, then push fixes to both PRs and merge green source layers.",
    "Full Sync, native connected-account, hosted/release and publication gates remain separately open."
  ]
}
```
