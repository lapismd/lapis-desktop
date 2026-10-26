# Main workspace file icon intake and SSH validation

```json
{
  "id": "E-ICONS-002",
  "tasks": ["M8.0"],
  "requirements": [
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-GOV-006",
    "LD-GOV-007",
    "LD-GOV-008",
    "LD-GOV-010"
  ],
  "revision": "enclosing Jujutsu change ttxzvpxl",
  "versions": {
    "base": "102c5c1e55ff1c5d082b129f3c2ce18b5105f275",
    "notesPublicSnapshot": "90beb54532f3d10fa7edede051c2c83086744ba2",
    "designCoreSource": "99fa0952",
    "basesSource": "67c763aa038b846075301d1f821d0b01725bc597",
    "node": "24.15.0",
    "pnpm": "10.34.5"
  },
  "files": [
    "scripts/validation/docker.mjs",
    "scripts/validation/model.mjs",
    "tests/governance/validation.test.mjs",
    "docs/validation.md",
    "spec/src/current/governance.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-ICONS-002.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md",
    "MIGRATION.md"
  ],
  "result": "pass",
  "remaining": [],
  "runs": [
    {
      "name": "ssh-transport-regressions",
      "command": "pnpm validation:check",
      "result": "pass",
      "failures": 0,
      "note": "Four new regressions fail before repair and pass afterward; original SSH case also passes. Full runner/composition suite passes 83 cases in Docker, run 6e33c98f."
    },
    {
      "name": "main-public-cohort-types",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Zero errors/warnings, Docker run 0c3925ee."
    },
    {
      "name": "main-public-cohort-builds",
      "command": "pnpm build\npnpm build-storybook",
      "result": "pass",
      "failures": 0,
      "note": "Production renderer and complete static catalog build pass in Docker runs 1098d6f2 and ea3683aa. Public product inputs stay unchanged across documentation snapshots."
    },
    {
      "name": "installed-main-archive-payloads",
      "command": "verifyArchiveResolution(root, selectedArchives, activeImportScopes)",
      "result": "pass",
      "failures": 0,
      "note": "28 selected archives match installed public payloads across 110 active import routes; receipt .local/main-icons-payload-verification.json. Explicit local prerequisite verification is separate from Docker qualification."
    },
    {
      "name": "main-complete-tests",
      "command": "pnpm test",
      "result": "pass",
      "failures": 0,
      "note": "Docker d990a8e8: all 511 Node, 744 AI and 246 Rust tests pass; two original opt-in native acceptance ignores retain their separate gates."
    },
    {
      "name": "main-complete-catalog",
      "command": "pnpm test:storybook -- --shard=1/4\npnpm test:storybook -- --shard=2/4\npnpm test:storybook -- --shard=3/4\npnpm test:storybook -- --shard=4/4",
      "result": "pass",
      "failures": 0,
      "note": "All 2,060 interaction/accessibility cases pass in four cold bounded workspaces. Per-presentation counts 121,121,131,142 each run both themes and both viewports. Retained runs: 147ca15b,89fed7cf,68bd9721,e8dfadae. Identical product/tool source and all 28 archive identities are verified."
    },
    {
      "name": "main-full-check",
      "command": "pnpm check",
      "result": "fail",
      "failures": 1,
      "note": "Docker adafc190 passes composition, canonical/source audits, strict types and strict normal/e2e Clippy. Only the previously accepted formatting exception in immutable E-AI-109 remains. Its bytes are unchanged from parent; no new failure is waived."
    }
  ],
  "milestoneReview": "M8.0 remains Done with all 2,060 combined-main catalog cases, static catalog and public-archive evidence. Native, provider, distribution, Review and Rust task statuses do not change.",
  "contractReview": "The host retains explicit App and public package ownership. SSH options preserve agent authentication, endpoint and literal arguments, exact snapshots, archives, resources, leases and Docker-only qualification.",
  "completedGates": {
    "M8.0": "Desktop catalog renders real production composition, builds statically and passes both-theme interaction/accessibility cases without native services."
  }
}
```

## Source, archives and ownership

Desktop main already adopts icon feature `102c5c1e`. This intake selects the
five public Notes packages from combined-main snapshot `90beb545`, retaining all
other prerequisites except the already qualified Design Core/Bases icons. All 28
archives match installed payloads across 110 active import routes. Prepared
package inputs are byte-identical to their frozen qualified source. This
selective intake does not claim complete latest-source freshness.

Notes owns icon registration, editor metadata and the Explorer adapter. Design
Core owns scoped rendering and fallback. Bases owns its SVG and patterns.
Desktop keeps its existing public WorkspaceShell acceptance and production
composition. No extension-to-icon map, copied artwork, new native permission or
second package implementation is added here. Tracked dependency metadata is
preserved by the explicit ignored archive setup.

## SSH repair and failed attempts

1Password-agent signing delays, reused-connection failures and later port-22
refusals interrupt early Docker submissions and report collection. Restored user
access admits one owned foreground authenticated connection. The private
`sshMultiplexing: false` and absolute `sshControlPath` options reuse it without
starting a background master. Defaults remain unchanged. Four new regressions
fail before repair and pass afterward; the original SSH regression also passes.
Authentication, endpoint/port checks, literal arguments, bounded attempts,
resources, source/archive identities, Docker isolation and leases remain intact.
No global SSH or credential configuration changes or host fallback occurs.

Ownership/completion-checked recovery collects successful retained Notes/Plugins
runs before releasing their leases. An incomplete prepared Desktop worker fails
closed on missing transferred inputs. Its completed-owner check precedes lease
release. A sequential complete Desktop catalog is deliberately interrupted to
switch to four bounded workspaces. Its worker is verified owned and stopped;
that run and its unexecuted following builds are not counted as passing gates.
Fresh independent production/static builds pass afterward.

Each final catalog shard runs with two CPUs and 8 GiB, one run per workspace.
The same source/cohort serves both themes and both viewports. Product and test
inputs stay identical across later documentation-only snapshots. All 2,060 cases
pass. Runs `147ca15b`, `89fed7cf`, `68bd9721` and `e8dfadae` retain 484, 484,
524 and 568 cases respectively. Their sources are identical at all product/tool
paths and all 28 archive identities match the main cohort.

## Other repositories and existing findings

Plugins main adopts merge `5b147147`, preserving its four pending Markdown and
lockfile changes. Its source/static/spec gates pass. The full catalog retains
285 passing and 13 failing cases; every failing case also fails on original main
with original archives (18 failures there). The user explicitly accepts this
separate Markdown/Transcript preview lifecycle work. The five prerequisite
advisories and existing CSV metadata/style/release-tooling findings retain their
accepted source records and publication remains blocked. These are not passing
release gates or waived diagnostic assertions.

## Milestone review

M8.0 remains Done with this additional complete combined-main catalog/static and
public-archive evidence. No native, provider, distribution, Review or Rust
migration gate changes. Visual review remains pending; no baseline is updated.

The first combined full check (`82256be2`) fails one documentation limit after
formatting expands the migration paragraph to 401 lines. The paragraph is
shortened without changing any requirement, gate or index entry, restoring 400
lines. The exact full check rerun passes those documentation gates and all
functional checks; it stops only on the already accepted immutable E-AI-109
format finding. All limits and assertions retain their original values.

Final
`LAPIS_DESKTOP_BASE=102c5c1e55ff1c5d082b129f3c2ce18b5105f275 pnpm spec:check`
passes all four canonical/progress/source/spec-first lanes and mdBook in Docker
run `2ce5a8c9`. The selected M8.0 evidence and generated migration summary
retain the original completion gate and unchanged native statuses.
