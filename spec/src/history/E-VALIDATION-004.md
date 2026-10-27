# Docker-default validation runtime and on-demand macOS lanes

```json
{
  "id": "E-VALIDATION-004",
  "date": "2026-10-27",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M8"],
  "requirements": ["LD-GOV-002", "LD-GOV-003", "LD-GOV-004", "LD-GOV-010"],
  "contractReview": "Make Linux Docker containers the default runtime for every standard Desktop lane and reduce macOS native/headed acceptance to inventoried on-demand opt-ins, following the same structural pattern as the live-provider runner: a dedicated dispatcher, a code-level default, a complete inventory, proven refusals and a governance audit that runs inside the default test lane so a future lane edit cannot silently re-add native-default collection. No assertion, threshold, timeout, tag or visual baseline was weakened, the accepted immutable E-AI-109 formatting exception is unchanged, and the hosted CI workflow was not rewritten: its macOS runner provides no Docker daemon and two of its steps are macOS-only by construction, so its runtime selection is documented and pinned by the audit instead.",
  "milestoneReview": "M8 retains its original gate; this record adds the runtime-default and on-demand lane policy beside E-VALIDATION-001/002/003 and the quiet-entrypoint records E-TEST-001/002. No native, provider, catalog, distribution, signing or visual gate is promoted, and live agent/provider acceptance stays deferred by the 2026-10-27 user decision recorded in E-CORE-048.",
  "versions": {
    "node": "24.10.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "userDecision": "2026-10-27",
    "dockerContext": "omarchy",
    "dockerHost": "x86_64, 16 CPUs, 62 GiB",
    "dockerServer": "29.7.2",
    "uiImage": "lapis-desktop-validation:ui-df937e8d52c5ccef1a04",
    "fullImage": "lapis-desktop-validation:full-2e8aced7fd4f01d6bd24",
    "releasedStaleLease": "lapis-desktop-validation-lease-da167e34226af956",
    "macosNativeLanes": 4,
    "governanceSuiteTests": 175
  },
  "files": [
    "AGENTS.md",
    "MIGRATION.md",
    "package.json",
    "scripts/macos-native-lanes.mjs",
    "scripts/validation/model.mjs",
    "scripts/validation/worker.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-VALIDATION-004.md",
    "tests/governance/native-lane-defaults.test.mjs",
    "tests/governance/validation.test.mjs"
  ],
  "remaining": [],
  "runs": [
    {
      "name": "Remote Docker host recovery and stale lease release",
      "command": "ssh -o ControlMaster=yes -o ControlPath=/tmp/lapis-desktop-omarchy.sock -o ControlPersist=8h -fN steve@<host> with backoff; add sshControlPath to the ignored .local/validation/config.json; pnpm validation:doctor; pnpm validation -- clean; pnpm validation -- clean --apply",
      "result": "pass",
      "failures": 0,
      "detail": "The host refused rapid direct SSH connects for most of the session (port 22 connection refused, plus one ssh-agent signing failure), which is why every earlier lane used explicit native host selection. A persistent ControlMaster succeeded on the first attempt and the documented sshControlPath tunable in the ignored local config restored every Docker call: validation:doctor reports daemon omarchy, x86_64, 16 CPUs, 62 GiB, server 29.7.2. The stale checkout lease container created 2026-10-27T14:32:48Z, which made every Docker lane fail with a name conflict, was released through the repository's own ownership-checked cleanup (preview then --apply, exit 0, 23:07:57Z-23:13:33Z) with cache volumes retained and no global prune. Both required images already exist, so no image build ran."
    },
    {
      "name": "First Linux Docker lane attempt",
      "command": "pnpm check; pnpm test (no runtime override, so the Docker default dispatched both to the Linux worker)",
      "result": "fail",
      "failures": 6,
      "detail": "check exited 1 with five LD-PROGRESS/LD-GOV-004 findings: the snapshot carried this slice's protected paths (package.json, scripts/macos-native-lanes.mjs and both governance tests) before its fresh evidence record existed. test exited 1 on one assertion in the new audit: validationConfig({}) reads the ambient environment and scripts/validation/worker.mjs:94 pins LAPIS_DESKTOP_VALIDATION_RUNTIME=native for nested in-container dispatch, so the code-level default must be asserted against an explicit empty environment. Story composition still reported 113 families/0 findings in the container."
    },
    {
      "name": "Audit repair and its exact targets in both environments",
      "command": "node --import tsx --test tests/governance/native-lane-defaults.test.mjs; LAPIS_DESKTOP_VALIDATION_RUNTIME=native LAPIS_DESKTOP_VALIDATION_WORKER=1 node --import tsx --test tests/governance/native-lane-defaults.test.mjs; node --import tsx --test --test-name-pattern='every nonvisual test command uses the portable runner' tests/governance/validation.test.mjs; node --import tsx --test tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "tests": 175,
      "detail": "Before: 1 failure in the Docker runtime assertion. After: 5/5 with a normal environment and 5/5 with the worker's native runtime exported, the portable-runner contract passes 1/1 with the dispatcher added to its existing explicit native-lane allowlist, and the complete governance glob passes 175/175 with 0 skipped."
    },
    {
      "name": "On-demand dispatcher refusals",
      "command": "env -u LAPIS_DESKTOP_NATIVE_LANE pnpm test:native:macos -- headed; LAPIS_DESKTOP_NATIVE_LANE=1 pnpm test:native:macos -- pnpm; LAPIS_DESKTOP_NATIVE_LANE=1 pnpm test:native:macos",
      "result": "pass",
      "failures": 0,
      "detail": "All three exit non-zero before dispatching anything: the missing opt-in, an unlisted lane name that the dispatcher never runs, and a missing lane selection that lists headed, api, onnx and provider-live. No native window, WebView or provider turn started while proving the refusals."
    },
    {
      "name": "Hosted CI runtime finding",
      "command": "read .github/workflows/ci.yml; pnpm exec prettier --check; grep the macOS-only guards in scripts/check-bundle.mjs and scripts/desktop-api-tests.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "CI runs on macos-15 with a global LAPIS_DESKTOP_VALIDATION_RUNTIME: native and executes check, test, spec:check, spec:first, check:bundle and test:desktop:headed. GitHub macOS runners provide no Docker daemon, and check:bundle plus the hidden API lane throw by construction off darwin/arm64, so moving the workflow to Linux would drop macOS-only coverage rather than add parity. Docker/Linux is therefore the default runtime for the standard lane set locally, CI keeps its documented provisioned native selection for the same lane set, and the audit pins both facts so neither can change silently. No workflow assertion was weakened."
    },
    {
      "name": "Lane classification for this verification cycle",
      "command": "classify every receipt under .local/qualification/r7-cohort/phase2 by the runtime that produced it",
      "result": "pass",
      "failures": 0,
      "detail": "native-fallback, labelled and never presented as Docker parity: the 16:04Z-18:31Z qualification lanes (spec/progress/audits, strict Clippy normal and e2e, svelte-check, 544 Node, 744 AI, 262 cargo, cold headed 109/109 with 28 WebKit specs, hidden API 21/21, focused admission 4/4, provider 2/2, both bundles and the 2,124-execution catalog lane) and the 19:42Z-22:48Z integrated-main re-runs, all with LAPIS_DESKTOP_VALIDATION_RUNTIME=native while the host refused SSH. On-demand macOS, explicit request only: headed acceptance, hidden API, focused admission/queue, bundles with check:bundle, and live provider. Deferred by the 2026-10-27 user decision: live agent/provider acceptance. Docker/Linux: this record's standard-lane re-runs below."
    },
    {
      "name": "Second Docker attempt blocked by a lease the interrupted first run left behind",
      "command": "pnpm check; pnpm test; pnpm spec:check; pnpm build; pnpm test:storybook",
      "result": "fail",
      "failures": 5,
      "detail": "All five lanes exited 1 within two seconds (23:34:37Z-23:34:39Z) on 'Conflict. The container name /lapis-desktop-validation-lease-da167e34226af956 is already in use by container 60b92d37...'. The first Docker chain created that lease at 23:17Z and was cancelled mid-run by a harness restart, so its finally-block release never executed; scripts/validation/leases.mjs creates the lease unconditionally and releases it only after a successful create. An owned helper now releases the lease through the repository's ownership-checked cleanup before the chain and retries a lane once on that exact conflict. No product source, lane definition or assertion changed."
    },
    {
      "name": "First complete standard lane set in Linux Docker containers",
      "command": "pnpm check; pnpm test; pnpm spec:check; pnpm build; pnpm test:storybook (no runtime override, so the Docker default dispatched every lane to the omarchy Linux x86_64 worker)",
      "result": "fail",
      "failures": 3,
      "detail": "23:37:07Z-00:43:16Z after the lease release. test exit 0: 554 Node cases, 744 AI cases in 151 files and cargo 258 passed/0 failed/2 ignored. spec:check exit 0: four lanes. build exit 0: 11,915 modules in 30.89s. catalog exit 0 in 58m12s: 16 mode runs, 452 file runs, 2,124 executions, 0 failures and 0 unhandled errors, per mode 29 files/128 cases, 28/127, 28/128 and 28/148 - identical totals to the native-fallback catalog run. check exit 1 on three Prettier warnings: the accepted immutable E-AI-109.md plus this slice's two new files, which had not been formatted; parity 113 families/0 findings, validation 6 validators/375 chapters/116 requirements, svelte-check 0 errors/0 warnings and Clippy clean for both configurations."
    },
    {
      "name": "Docker spec-first lane defect and its repair",
      "command": "pnpm spec:first in Docker; read .local/validation/runs/<run>/container.log; extract specFirstArgs into scripts/validation/model.mjs and wire scripts/validation/worker.mjs; node --import tsx --test --test-name-pattern='spec-first range' tests/governance/validation.test.mjs; pnpm spec:first in Docker",
      "result": "fail",
      "failures": 1,
      "detail": "Before: the lane exited 1 without evaluating anything, because the worker injected --head unconditionally and --base only when the host exported LAPIS_DESKTOP_BASE, so spec-validator printed '--head requires --base' and its usage text. The range construction is now one pure exported helper that pins both ends or neither, leaving the container's snapshot ancestry to decide exactly as the spec:check lane's internal gate does; CI's explicit --base/--head invocation is untouched. After: the behavioral regression passes 1/1 and Docker spec:first passes with 9 protected files and 2 canonical chapters. No gate, mapping or assertion was weakened."
    },
    {
      "name": "Fresh-evidence refusal for the tooling repair",
      "command": "pnpm check; pnpm spec:check; pnpm check:progress in Docker before this record named the tooling paths",
      "result": "fail",
      "failures": 2,
      "detail": "LD-PROGRESS/LD-GOV-004 correctly refused scripts/validation/model.mjs and scripts/validation/worker.mjs for lacking fresh evidence coverage, failing check, spec:check and check:progress. Naming both paths in this record cleared all three; the record's files list now matches the complete working-copy diff exactly."
    },
    {
      "name": "Final complete standard lane set in Linux Docker containers",
      "command": "pnpm check; pnpm test; pnpm spec:check; pnpm check:progress; pnpm spec:first (Docker default, no override)",
      "result": "fail",
      "failures": 1,
      "detail": "01:00:39Z-01:05:55Z. test exit 0: 555 Node cases (up from 554 by the new spec-first range regression), 744 AI cases in 151 files, cargo 258 passed/0 failed/2 ignored across 54 suites. spec:check exit 0: validate, rust-format, mdbook and spec-first. check:progress exit 0: 58 tasks and 330 evidence records. spec:first exit 0: 9 protected files and 2 canonical chapters. check exit 1 retains exactly one warning, the accepted immutable E-AI-109.md, with parity 113/0, validation 6 validators/375 chapters/116 requirements, svelte-check 0/0 and Clippy clean in 4.79s and 5.43s. Cargo passes 262 on the macOS host versus 258 in Linux, both 54 suites with 0 failures and the same 2 ignores; the difference is target-gated macOS coverage in ai_provider_keychain, macos_system_actions and terminal_policy, which the on-demand macOS lane owns. The 2,124-execution Docker catalog receipt still covers the final tree because the only later deltas are scripts/validation, tests/governance and specification Markdown - no catalog, src, .storybook or vitest input."
    }
  ],
  "gaps": [
    "Docker lanes qualify the Linux container runtime only. They cannot qualify the macOS application bundle, the real WebKit WebView, window chrome, OS actions or an installed provider; those remain on-demand lanes with their own fresh-receipt rules, and a Docker pass is never native product acceptance.",
    "Hosted CI still selects its provisioned native runtime, so CI and the local default differ in runtime while sharing the lane set. Reconciling them would need a Linux CI job plus a separate macOS job for the bundle and headed lanes, which is a workflow change outside this slice.",
    "The ignored local validation config now carries a persistent sshControlPath and 8 CPUs/24 GiB bounds. Those are machine-local settings and are never committed; the tracked manifest, lockfile and lane definitions are unchanged.",
    "Operational hazard, owner Desktop tooling: withWorkspaceLease creates the checkout lease unconditionally and releases it only after a successful create, so any interrupted Docker run leaves a lease container that makes every later lane for this checkout fail with a name conflict until an owner releases it. This happened twice (14:32:48Z and 23:17Z). Repairing lease acquisition to adopt or release an already settled lease needs its own slice with validation-leases coverage; it was recorded rather than bundled into this policy change."
  ]
}
```
