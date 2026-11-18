# Verify repaired Desktop public-package intake

```json
{
  "id": "E-RETIRE-010",
  "date": "2026-11-18",
  "revision": "enclosing-change",
  "result": "pending",
  "versions": {
    "desktopFixtureHead": "5006a7cffe2f8d816bd822e1cc1a882e88a357be",
    "consumerReceipt": "afd3ea97a8ff8dcd36934f4116c4e6d7e0f16376",
    "notesSource": "5ffb33c152404b6880debd1b5fd70762121d6196",
    "node": "24.15.0",
    "pnpm": "10.34.5",
    "specValidator": "0.2.1"
  },
  "requirements": ["LD-GOV-006", "LD-AI-002"],
  "files": [
    "spec/src/current/ai-adapter.md",
    "spec/src/history/E-RETIRE-010.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md"
  ],
  "contractReview": "Integrate the immutable E-RETIRE-002 consumer receipt with repaired E-RETIRE-003/005 producers. Preserve core API services/functions, future Language Service implementation/wiring and every Rust/native source pin. No production source, public contract, dependency range, installer policy or user profile changes. Resolve additive evidence-navigation and verification conflicts by retaining all receipts.",
  "acceptanceReview": "Close only the fresh private-artifact production/admission and hosted portable consumer boundary when all exact-head jobs pass. Preserve original E-RETIRE-002 pending/native and earlier failed preparation records. Fresh hosted same-run installed-package guard tests and complete interaction/axe evidence are stronger than a replayed old full artifact. Actual native preservation, App Profile storage/lifecycle and distribution remain separate.",
  "artifact": {
    "runId": 44201504767,
    "head": "5006a7cffe2f8d816bd822e1cc1a882e88a357be",
    "artifactId": 14383324700,
    "name": "private-packages-linux-x64-1",
    "zipSize": 1634575,
    "zipSha256": "79b50372d6b9a547180723052fc55188b68a107bbeec8fe5b008213fae3c5ac4",
    "originalEventCommit": "c22dd5542f5995a2f674f22437f939375b2e6395",
    "dependencyArchiveCount": 8,
    "tasksNativeFixtureRoleVerified": true,
    "languageServiceFiles": 20,
    "languageServiceDistFiles": 16,
    "apiSha256": "2917dc6b4723e1423e13aef1cccb9bf23b844b28d358d0725710efd889f8ccd7"
  },
  "runs": [
    {
      "name": "Source runtime equivalence",
      "command": "jj diff --from 351811a9 --to 5006a7cf --summary -- src src-tauri catalog tests/ai tests/renderer package.json pnpm-lock.yaml",
      "result": "pass",
      "failures": 0,
      "detail": "No changes. The repaired producer adds build/admission preparation and its governance coverage, without changing renderer/native/catalog runtime or the private app manifests. Integration against5006 changes only documentation."
    },
    {
      "name": "Complete artifact inspection and preserved provenance",
      "command": "Inspect fresh workflow44201504767 artifact14383324700 against original CI identity, declared exports, source pins and archive hashes",
      "result": "pass",
      "failures": 0,
      "detail": "All8dependency archives plus Tasks native-fixture role verify. Original run/event provenance is retained; local development overlay references individual verified archives only. No old full artifact replay. Both fresh architecture producers pass."
    },
    {
      "name": "Independent current archive comparison",
      "command": "Compare and SHA256-check all8old and8fresh local archives; compare every API tar member byte",
      "result": "pass",
      "failures": 0,
      "detail": "All16archive files match declared hashes. Seven archive hashes equal E-RETIRE-002 exactly. The only API content delta is package/dist/components/configuration/object-array-table-dnd.d.ts: two existing SETTINGS_TABLE_ROW_TYPE/COL_TYPE declarations change any to string; all other files, including JavaScript, are byte-identical. No core API source/function is changed."
    },
    {
      "name": "Same-run installed public retirement guard",
      "command": "Hosted unit job134477763983 step18, desktop-ai-policy tests/ai/plugin/retired-distribution.test.ts",
      "result": "pass",
      "failures": 0,
      "detail": "2tests pass at2026-11-18T00:35:45.4492146Z. Step12 downloads artifact14383324700 from same run44201504767 and matches its ZIP SHA256; steps13/14 verify/extract/install the prepared public packages before testing. Rejects the original retired provenance while preserving independent ai-origin ordinary admission."
    },
    {
      "name": "Hosted complete cold interaction and accessibility matrix",
      "command": "Workflow44201504767 Storybook shards1-4 and aggregate",
      "result": "pass",
      "failures": 0,
      "detail": "All2168executions pass: four viewport/theme rounds,116story files per complete round; shard counts127/134/130/151 per round. No baseline changes or source assertion waivers."
    },
    {
      "name": "Exact-head overall hosted qualification",
      "command": "Workflow44201504767 for head5006a7cf",
      "result": "pending",
      "failures": 0,
      "detail": "Governance, complete producers, audits, quality, unit, static/interaction catalog and ARM64 release build pass. Final x64 release build is still running. Do not claim workflow success before its terminal state."
    },
    {
      "name": "Specification discovery and doctor",
      "command": "Published spec-validator0.2.1 doctor and pnpm spec:search LD-GOV-006",
      "result": "fail",
      "failures": 1,
      "detail": "Existing host QMD native ABI147 mismatch; search explicitly falls back to text and finds the owning requirement. Config/book/source checks pass; custom script-alias warning retained. No global tooling edits or host product fallback."
    },
    {
      "name": "Combined canonical and evidence integration",
      "command": "node scripts/validation.mjs run spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "7fa822db-e8cd-46f3-96ea-8b3a957b665e: all four lanes pass (validate/evidence/source governance, Rust formatting, mdBook and spec-first). Pinned omarchy Docker, 2 CPU/4 GiB, complete eight-package verified individual archive overlay. No runtime source changes or native macOS execution."
    },
    {
      "name": "Final evidence metadata validation",
      "command": "node scripts/validation.mjs run check:evidence",
      "result": "pass",
      "failures": 0,
      "detail": "3ac44a12-39cf-4b9b-bf2d-5db327a42fa6: 511 records pass against the complete fresh eight-package overlay. Final run-detail strings are recorded/formatted after execution; overall hosted/native status remains pending, not waived."
    }
  ],
  "remaining": [
    "Finish exact-head hosted workflow and integrate the verified feature branch.",
    "Actual original/synthetic external-versus-bundled native startup/data/preferences/Safe Mode/cold-reopen acceptance remains unexecuted.",
    "App Profile native-chat storage/lifecycle is separate; package publication, registry-only adoption, Website deployment and installed-app replacement remain separately gated."
  ]
}
```

E-RETIRE-002/003/005 remain immutable. This receipt preserves the full
Desktop/Deno-only scope and does not authorize core API retirement or native
macOS execution. Terminal migration remains last.
