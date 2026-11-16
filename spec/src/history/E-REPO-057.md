# Prepare native remotes transport

```json
{
  "id": "E-REPO-057",
  "date": "2026-11-15",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-REPO-001", "LD-REPO-002", "LD-REPO-005"],
  "versions": {
    "node": "24.10.0",
    "desktopParent": "f60e45d885b02358ca6478f53b5e7cb596163ddf",
    "sharedHistoryCandidate": "5499c579"
  },
  "files": [
    "src/lib/native/repository/remotes.ts",
    "tests/renderer/repository-remotes-port.test.mjs",
    "spec/src/current/repository.md",
    "spec/src/backlog/vault-synchronization.md",
    "spec/src/verification.md",
    "spec/src/navigation/history-02.md",
    "spec/src/history/E-REPO-057.md"
  ],
  "contractReview": "The new transport remains unregistered. Native roots, custody, target admission, synchronization scheduling and publication remain Core/host-owned. This preparation cannot enable transfers or replace existing backup recovery records.",
  "acceptanceReview": "Direct Node TypeScript stripping exercises only this dependency-free transport leaf. Thirteen cases pass after the missing-module baseline. This is not package compilation, host composition, credential custody, network transport or native app acceptance.",
  "runs": [
    {
      "name": "transport-baseline",
      "command": "node --test tests/renderer/repository-remotes-port.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "The requested adapter module does not exist."
    },
    {
      "name": "transport-after",
      "command": "node --test tests/renderer/repository-remotes-port.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "13 cases: exact target/apply identities, no lost-response replay, current-code copy before browser, URL refusal, clipboard failure, close fences and normalized native errors."
    },
    {
      "name": "architecture",
      "command": "node scripts/source-audit.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "app-ownership",
      "command": "node scripts/source-audit.mjs --app-only",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "doctor",
      "command": "spec-validator doctor --json",
      "result": "pass",
      "failures": 0,
      "note": "Latest Deno-free public CLI via sibling tooling path; native QMD works, existing script-alias warning remains."
    },
    {
      "name": "specification",
      "command": "spec-validator check",
      "result": "fail",
      "failures": 1,
      "note": "No Desktop dependencies are installed in this isolated workspace. Existing Storybook parity plugin cannot import TypeScript. No diagnostic is suppressed."
    }
  ],
  "remaining": [
    "Install the documented verified public archive cohort and run type/package/consumer validation.",
    "Implement Desktop OS custody, admitted native routes and saved automatic preference/recovery migration before registering the port.",
    "Replace copied Repository presentation through shared public imports, retain catalog identities and qualify cold host transports.",
    "Complete exact-head hosted gates and GitHub release."
  ]
}
```

This is an unregistered transport preparation. It does not replace the existing
Desktop Repository composition, mutate credentials or issue network operations.
The leaf accepts only the opaque vault session and exact public commands. Stored
credentials are never read by it. GitHub authorization uses the current native
observation, then the existing clipboard and external-open host commands.
