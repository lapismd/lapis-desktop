# Adopt the published Notes mobile cohort

```json
{
  "id": "E-MOBILE-006",
  "date": "2026-11-13",
  "revision": "enclosing-change",
  "result": "pending",
  "versions": {
    "desktopBase": "6d96f584fe9200bfbb85136814252abaae73998a",
    "notesSource": "cdad0cde972f64bc0f20896d493c97268cc97b51",
    "notesReleaseRun": 43519611859,
    "core": "0.13.0",
    "api": "0.3.1",
    "ui": "0.1.9",
    "workspace": "0.4.0",
    "fileExplorer": "0.2.5",
    "languageService": "0.1.3",
    "privateProfile": "0.0.0",
    "aiSource": "9a98293c26524c9320acdd9767e34e8ffdd7170c",
    "nativeNotesSource": "40b9ba8ee569a737a0ace77870a094972ee6f768"
  },
  "requirements": ["LD-SESSION-005", "LD-GOV-006", "LD-GOV-008", "LD-CAT-005"],
  "files": [
    "catalog/plugins/Workspace.stories.ts",
    "package.json",
    "pnpm-lock.yaml",
    "scripts/ci-sources.json",
    "tests/governance/ci-prerequisites.test.mjs",
    "spec/src/current/governance.md",
    "spec/src/current/plugins.md",
    "spec/src/current/mobile-layout.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/backlog.md",
    "spec/src/verification.md",
    "spec/src/navigation/history-02.md",
    "spec/src/history/E-MOBILE-006.md",
    "tests/governance/validation-native.test.mjs",
    "spec/src/backlog/distribution.md"
  ],
  "contractReview": "Consume the source-owned mobile bindings through released registry packages. Core owns presentation; Workspace supplies App-owned Search, note creation and command palette. The intentionally private App Profile stays at ^0.0.0 and uses its built public native-chat export. JavaScript and private-profile pins advance independently of qualified Rust pins. No source aliases, copied components or native product claims.",
  "acceptanceReview": "The original responsive production-root target passes all four variants before and after adoption. Old Workspace lacks the App-owned Search action (one regression failure); the published cohort passes all 28 Workspace story cases including mobile actions in wide/narrow and light/dark modes. Full local Node and AI suites pass. Hosted complete catalog, Linux check/test/build/audit and native compilation remain mandatory before merge; browser proof does not qualify a native app.",
  "remaining": [
    "Require all hosted checks on the PR head before merge.",
    "Published feature-package API 0.2.x peer declarations remain visible as seven warnings; Notes owns the metadata refresh.",
    "Actual native application/window and registry-only distribution qualification remain separate; visual review is pending."
  ],
  "runs": [
    {
      "name": "responsive-baseline",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:storybook -- catalog/plugins/Workspace.stories.ts -t 'Responsive Layout'",
      "result": "pass",
      "failures": 0,
      "detail": "4/4 desktop/narrow and light/dark variants pass before this follow-up. This is explicit host browser qualification, not portable/native application acceptance."
    },
    {
      "name": "mobile-actions-before",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:storybook -- catalog/plugins/Workspace.stories.ts -t 'Mobile Actions'",
      "result": "fail",
      "failures": 1,
      "detail": "1 failed, 6 not-selected stories on desktop/light. Old Workspace 0.3.4 has no accessible Open search sidebar action. The baseline private archives match exact-main CI run 43509179410 artifact 14078795265; ZIP SHA256 288253feba8a78861fe858b24f1bf3430e9fffafc1d0d2cc312330ead4177c42. Local baseline uses the documented explicit private archive projection, not same-run hosted artifact reuse."
    },
    {
      "name": "registry-visibility-before",
      "command": "node .local/mobile-pr/verify-published.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "First four attempts retained: initially UI then API returned 404 during npm propagation after all five versions were accepted. No version was republished."
    },
    {
      "name": "hosted-registry-verification-before",
      "command": "GitHub Actions run 43519611859 attempt 1 job 132215962696",
      "result": "fail",
      "failures": 1,
      "detail": "Registry consumer install exhausted publication propagation retries before API 0.3.1 became visible. Only Verify published packages was retried."
    },
    {
      "name": "registry-bytes-and-provenance",
      "command": "node .local/mobile-pr/verify-published.mjs (attempt 5)",
      "result": "pass",
      "failures": 0,
      "detail": "All five next tags, sizes, SHA256, SHA512 integrity, exact approved tarball bytes and SLSA source/run predicates match cdad0cde / publication run 43519611859."
    },
    {
      "name": "temporary-full-archive-install",
      "command": "pnpm local:install .local/mobile-pr/propagation-validation-archives.json",
      "result": "fail",
      "failures": 1,
      "detail": "Archive admission correctly refused API 0.3.1 against old feature-package peer ^0.2.0. Assertions were retained. Normal registry intake uses only the two intentionally private archive prerequisites and leaves peer warnings visible."
    },
    {
      "name": "host-node-first-attempt",
      "command": "node --import tsx --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "fail",
      "failures": 3,
      "detail": "757 total: 754 pass, 3 fail. One stale native/JavaScript pin equality is repaired with exact independent Notes pins. Two environment failures require a colocated checkout and an explicit installed Xcode SDK. No native app was launched."
    },
    {
      "name": "native-pin-regression-after",
      "command": "node --import tsx --test tests/governance/validation-native.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "9/9 pass; both Notes source identities are pinned explicitly and the other shared source identities remain equal."
    },
    {
      "name": "new-mobile-scenario-first-attempts",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:storybook -- catalog/plugins/Workspace.stories.ts -t 'Mobile Actions'",
      "result": "fail",
      "failures": 5,
      "detail": "Five new-test authoring attempts retained, each with one failure: a desktop-only rename selector; Browse fallback absent when Search is supplied (two attempts); a closing Select portal still blocked pointer input; a generic contenteditable query matched Search instead of the Markdown editor. The final scenario uses public mobile roles and waits for pointer readiness without bypassing it."
    },
    {
      "name": "hosted-publication-final",
      "command": "GitHub Actions run 43519611859 attempt 2",
      "result": "pass",
      "failures": 0,
      "detail": "Publication, registry consumer verification, GitHub releases and dependency notification all succeeded. Only verification and downstream jobs were retried; publication ran once."
    },
    {
      "name": "frozen-registry-intake",
      "command": "node .local/mobile-pr/registry-lock.mjs; node .local/mobile-pr/install-candidate.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Portable registry lock and frozen registry projection pass. The two private App Profile/AI archives match checksums and installed payloads; the private install projection also passes frozen install. Tracked registry manifests/lock are restored. Root resolves one API 0.3.1/Core 0.13.0 context; seven old feature API peer-range warnings remain visible."
    },
    {
      "name": "node-suite-colocated",
      "command": "SDKROOT=/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX27.2.sdk node --import tsx --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "757/757 pass in isolated colocated source snapshot a92e947703463b9d1ec21df4a7c5d4cd31d785a6 with the actual installed Xcode SDK. No global SDK or Git configuration changed."
    },
    {
      "name": "ai-suite",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:ai",
      "result": "pass",
      "failures": 0,
      "detail": "746/746 tests in 152 files pass."
    },
    {
      "name": "mobile-actions-after",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:storybook -- catalog/plugins/Workspace.stories.ts -t 'Mobile Actions'",
      "result": "pass",
      "failures": 0,
      "detail": "4/4 viewport/theme variants pass in cold Vite processes. App-owned Search, shadcn sidebar Select, real Untitled.md creation, editor identity through sidebar selection, palette opening and note editing are exercised."
    },
    {
      "name": "source-and-story-audits",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check:architecture; pnpm check:app-ownership; pnpm check:storybook-parity",
      "result": "pass",
      "failures": 0,
      "detail": "Source boundaries pass; 114 governed story families have zero composition findings."
    },
    {
      "name": "manual-populated-mobile-review",
      "command": "Cold Storybook at http://127.0.0.1:7480/iframe.html?id=desktop-notes-workspace--mobile-actions&viewMode=story",
      "result": "pass",
      "failures": 0,
      "detail": "Real populated mobile story rendered Untitled.md with Mobile note. At 495x908 Settings exposes a visible Close settings button; clicking it returns to the same editor. Temporary viewport override was reset. Baselines remain unchanged and visual review remains pending."
    },
    {
      "name": "complete-workspace-family",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:storybook -- catalog/plugins/Workspace.stories.ts",
      "result": "pass",
      "failures": 0,
      "detail": "28/28 interaction/accessibility cases pass: seven real production-root stories across four viewport/theme modes. The exact Responsive Layout and Mobile Actions targets are retained; every variant starts a fresh Vite process."
    },
    {
      "name": "final-type-check",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check:types",
      "result": "pass",
      "failures": 0,
      "detail": "0 Svelte/TypeScript errors and 0 warnings."
    },
    {
      "name": "spec-and-evidence",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:check; pnpm check:evidence",
      "result": "pass",
      "failures": 0,
      "detail": "All four aggregate specification lanes and 466 evidence records pass. Spec Validator 0.2.0 is the latest published Deno-free version. Doctor and QMD semantic search pass under Node 24.15.0; the initial missing-QMD PATH lookup was repaired by selecting the installed binary."
    },
    {
      "name": "retained-new-test-attempts",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:storybook -- catalog/plugins/Workspace.stories.ts -t 'Mobile Actions'",
      "result": "pass",
      "failures": 0,
      "detail": "Five failed authoring attempts are retained above, followed by 4/4 passes; no product assertion, pointer policy or timeout was bypassed."
    },
    {
      "name": "live-source-identity",
      "command": "curl --fail https://app.lapis.md/version.json",
      "result": "pass",
      "failures": 0,
      "detail": "Production still serves approved cdad0cde972f64bc0f20896d493c97268cc97b51, whose live persistence/resizing acceptance is retained in Notes source evidence."
    },
    {
      "name": "renderer-build",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm build",
      "result": "pass",
      "failures": 0,
      "detail": "Production renderer builds successfully; 16,550 modules transformed. This is renderer packaging, not a native application launch or distribution gate."
    },
    {
      "name": "evidence-final-draft-before",
      "command": "pnpm exec spec-validator validate --json; LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check:evidence",
      "result": "fail",
      "failures": 1,
      "detail": "Both commands reported the same receipt-state error: pass requires no remaining gaps. The receipt result is pending because native/distribution/visual boundaries and the hosted merge gate remain explicit; all passing local run outcomes are retained."
    }
  ]
}
```

Source evidence and prior failed receipts remain immutable. No installed
application or user profile is used by this qualification. Visual review remains
pending.
