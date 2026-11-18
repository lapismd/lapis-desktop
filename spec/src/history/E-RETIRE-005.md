# Complete fresh public-package fixtures

```json
{
  "id": "E-RETIRE-005",
  "date": "2026-11-17",
  "revision": "enclosing-change",
  "result": "pending",
  "versions": {
    "hostNode": "26.9.0",
    "dockerNode": "24.15.0",
    "pnpm": "10.34.5",
    "specValidator": "0.2.1",
    "base": "248e8d59de2d20ec921f5db39ee2fe030617a3c0",
    "pluginsJavascript": "969356250f26c5561fac22cf00d8da8f395dbdae",
    "pluginsRust": "879581d1549187bdbac2d75b40d02e0df46e721a",
    "notesSource": "5ffb33c152404b6880debd1b5fd70762121d6196",
    "tasksSource": "7e25dc5cce821baca7831827f1711c1f18cbabf1"
  },
  "requirements": [
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-006",
    "LD-GOV-007",
    "LD-GOV-008"
  ],
  "files": [
    "scripts/ci-artifact-identity.mjs",
    "scripts/ci-dependency-artifact.mjs",
    "scripts/ci-install.mjs",
    "scripts/ci-native-fixtures.mjs",
    "scripts/ci-prepare-links.mjs",
    "scripts/package-archive-exports.mjs",
    "spec/src/backlog/distribution.md",
    "spec/src/current/governance.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md",
    "tests/governance/ci-artifacts.test.mjs",
    "tests/governance/package-archive-exports.test.mjs",
    "tests/governance/retired-plugin-sources.test.mjs",
    "spec/src/history/E-RETIRE-005.md"
  ],
  "contractReview": "Desktop owns private source preparation and archive admission. Build direct Language Service independently of App Profile closure and retain its own marker/output receipt. Require declared public exports, types and wildcard targets to exist in packed archives before installation and during artifact verification; hash the guard implementation into artifact identity. Native fixture preparation builds the frozen Plugins-owned Markdown public exports through its normal build before runtime bundling. Keep every Rust/native/AI/Tasks pin, public range, trust default and same-run artifact provenance rule unchanged.",
  "acceptanceReview": "The first fresh hosted producer emitted a correctly hashed but incomplete Language Service archive; hashes and audit success did not prove declared exports. Executable controls cover independent source preparation and archive/full artifact admission. Exact seven-plugin production runs in isolated omarchy Docker with2CPUs/4GiB, no browser/Rust/macOS app. Local projection uses eight individually verified public archives, preserving source manifests and never reusing/spoofing a full hosted projection/provenance. Native product startup/data preservation remains separate.",
  "artifactBefore": {
    "runId": "44199028277",
    "attempt": 1,
    "head": "248e8d59de2d20ec921f5db39ee2fe030617a3c0",
    "mergeSource": "eb439c71f40741e983cb5fa2f57aa34f7ade1206",
    "artifactId": 14380432818,
    "zipSha256": "40cebfc2d0dd1eaf6a86441197aeedefe23e5f974350a0725ef0b93331f15147",
    "sourceInputsSha256": "b3a598669587eb8de3dfb66d7ce55b009e72f95a42b62171be95bd66c8cd16b5",
    "languageServiceFiles": 4,
    "completeOwnerLanguageServiceFiles": 20,
    "apiFiles": 569,
    "apiChangedFiles": [
      "dist/components/configuration/object-array-table-dnd.d.ts"
    ],
    "apiChange": "Two row/column constants infer string instead of any. All568other files, including runtime JS, are identical. Actual fresh consumer type and wider required lanes must qualify these archive bytes."
  },
  "runs": [
    {
      "name": "Initial preparation/export regressions before",
      "command": "node --test tests/governance/package-archive-exports.test.mjs",
      "result": "fail",
      "failures": 2,
      "detail": "0pass/2fail: no independent Language Service marker and no packed-export guard."
    },
    {
      "name": "Preparation/export and artifact controls after",
      "command": "node --test tests/governance/package-archive-exports.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "3pass. Adds full verifyDependencies rejection of a correctly hashed controlled archive with missing declared runtime export; complete archive admitted."
    },
    {
      "name": "First independent native fixture production",
      "command": "node .local/validation/retirement-run-native-fixtures.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "Worker4a062c43-f200-42e4-8c35-64fa6687b845:40governance pass; exact producer builds Bookmarks/Wordcount then Slides fails resolving @lapis-notes/markdown/embed. Frozen Plugins install links owned workspace Markdown, whose dist was never built. Keep failure; do not externalize or alias the missing contract."
    },
    {
      "name": "Markdown preparation regression before",
      "command": "node --test tests/governance/retired-plugin-sources.test.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "3pass/1fail: no owning Markdown normal-build closure before runtime bundling."
    },
    {
      "name": "Markdown preparation regression after",
      "command": "node --test tests/governance/retired-plugin-sources.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "4pass. Retirement audit still precedes install/build, including warm reuse."
    },
    {
      "name": "Expanded bounded Docker governance",
      "command": "node --import tsx --test tests/governance/package-archive-exports.test.mjs tests/governance/turbo-task-graph.test.mjs tests/governance/ci-artifacts.test.mjs tests/governance/ci-prerequisites.test.mjs tests/governance/retired-plugin-sources.test.mjs tests/governance/local-macos-build-exclusion.test.mjs tests/governance/validation-native.test.mjs tests/governance/native-fixture-portability.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "42pass/0fail in worker5d3da1ab-7c03-475c-8fda-a95a20a8dafb. Includes existing artifact identity/mutation, source pin, public preparation, explicit native-lane and source audit controls."
    },
    {
      "name": "Architecture and App ownership",
      "command": "node scripts/source-audit.mjs; node scripts/source-audit.mjs --app-only",
      "result": "pass",
      "failures": 0,
      "detail": "Both source-only boundary audits pass."
    },
    {
      "name": "Expanded host dependency attempt",
      "command": "node --test tests/governance/package-archive-exports.test.mjs tests/governance/turbo-task-graph.test.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "2pass/1file fail: isolated host authoring tool install lacks yaml. Same owning Turbo test file passes in provisioned Docker42case run; product does not fall back to host."
    },
    {
      "name": "Exact native fixture producer after Markdown build prerequisite",
      "command": "node scripts/ci-native-fixtures.mjs inside isolated2CPU/4GiB Docker worker5d3da1ab-7c03-475c-8fda-a95a20a8dafb",
      "result": "pass",
      "failures": 0,
      "detail": "All7plugin runtimes and Tasks native artifact built. Owning Markdown normal svelte-package/publint passes. Existing Plugins audit and7payload reproduction/hash verifications pass; existing advisory policy unchanged."
    },
    {
      "name": "Diagnostic verifier identity correction",
      "command": "Independent signed-output verification wrapper",
      "result": "fail",
      "failures": 1,
      "detail": "Producer, audit and7payload checks already passed. Diagnostic wrapper incorrectly expected markdown-lint instead of actual lapis-markdown-lint runtime ID; retain failure and reverify unchanged bytes with correct ID. No product mutation or rebuild."
    },
    {
      "name": "Signed fixture and Tasks output verification",
      "command": "node .local/validation/retirement-verify-native-fixtures.mjs in the same stopped/restarted task-owned Docker worker",
      "result": "pass",
      "failures": 0,
      "detail": "7Ed25519 signatures, exact sorted file lists, runtime metadata, per-file size/SHA256 and archive digests verified. All signed source commits equal969. No retired AI. Retained Tasks source7e25dc5c and native public-port manifest/hash verification pass; ephemeral signing key absent."
    },
    {
      "name": "Canonical source/evidence qualification",
      "command": "spec-validator validate --json; spec-validator first --base248e8d59 --head@ --json; spec-validator build --json; node scripts/evidence.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "7validators/571chapters/134requirements nofindings;9protected files/2canonical chapters; mdBook builds;509immutable/fresh evidence records pass. Changed-page boundaries retained."
    }
  ],
  "remaining": [
    "Regenerate the fresh complete hosted dependency artifact after this repair and qualify actual consumer types, required functional/catalog/build lanes and full same-run artifact fanout.",
    "Native app/data preservation, package publication, website cutover and installed-app replacement remain separately gated."
  ],
  "fixtureOutputs": {
    "plugins": [
      {
        "pluginId": "bookmarks",
        "version": "0.1.13",
        "sha256": "e50da28997611813c9c1ab0b25c4661dc9ea498096128f4ddb76bb0d9c9f4bf9",
        "files": 4,
        "sourceCommit": "969356250f26c5561fac22cf00d8da8f395dbdae"
      },
      {
        "pluginId": "wordcount",
        "version": "0.1.5",
        "sha256": "b1ba817d934a8103d15b0f7de0092619aaa50b7de055c67a7b8e3732573e4eac",
        "files": 4,
        "sourceCommit": "969356250f26c5561fac22cf00d8da8f395dbdae"
      },
      {
        "pluginId": "lapis-slides",
        "version": "0.1.4",
        "sha256": "597397219bec3937fe864aa8f3a712614d1343b00f9c084748192cc8aa005eee",
        "files": 178,
        "sourceCommit": "969356250f26c5561fac22cf00d8da8f395dbdae"
      },
      {
        "pluginId": "bases",
        "version": "0.4.2",
        "sha256": "725ab2d5b7f84cd9c15d7cdc64fd62dbeae9e39ea6bf919dd35237716aa25b3b",
        "files": 8,
        "sourceCommit": "969356250f26c5561fac22cf00d8da8f395dbdae"
      },
      {
        "pluginId": "history",
        "version": "0.5.1",
        "sha256": "10f8d02d8902d9da875eeed7832ffde8cc3adaf9cc83b9839fe266eb135facba",
        "files": 4,
        "sourceCommit": "969356250f26c5561fac22cf00d8da8f395dbdae"
      },
      {
        "pluginId": "lapis-markdown-lint",
        "version": "0.1.5",
        "sha256": "1be4be0d735fa893a75fdb711453eee060ee3f10e618b9ecd38c351c08430b81",
        "files": 6,
        "sourceCommit": "969356250f26c5561fac22cf00d8da8f395dbdae"
      },
      {
        "pluginId": "spellcheck",
        "version": "0.1.6",
        "sha256": "4986bb792acc7385e0ec7205e7442815e2c07b39b9116de417e08ce5ca478c38",
        "files": 8,
        "sourceCommit": "969356250f26c5561fac22cf00d8da8f395dbdae"
      }
    ],
    "tasks": {
      "version": "0.2.0",
      "source": {
        "name": "@lapis-notes/lapis-plugin-tasks",
        "version": "0.2.0",
        "sha256": "9ff0dbdec630b0e56fbaa21957349ee22248d80759fa0a3f1a5b3c3a9b898cff",
        "source": {
          "name": "lapis-plugin-tasks",
          "repository": "lapismd/lapis-plugin-tasks",
          "revision": "7e25dc5cce821baca7831827f1711c1f18cbabf1"
        }
      },
      "files": [
        "apl-fqmucPXA.js",
        "asciiarmor-DucZyvP0.js",
        "asn1-BnOEsgAm.js",
        "asterisk-QAlztEwS.js",
        "brainfuck-DZVCuF_t.js",
        "clike-CTYGlS6x.js",
        "clojure-BhXMqnxz.js",
        "cmake-BGaNd9E7.js",
        "cobol-4yqQntpt.js",
        "coffeescript-D2dXvhEc.js",
        "commonlisp-CF_VNHQR.js",
        "crystal-DyuLTqLs.js",
        "css-DkSyTW67.js",
        "cypher-Dlu_3r4V.js",
        "d-UURgV0Ux.js",
        "diff-B_Bi2Crb.js",
        "dockerfile-Bvk733Ga.js",
        "dtd-Dy74G54E.js",
        "dylan-TSb-Nfix.js",
        "ebnf-4fKAGW3a.js",
        "ecl-B59qGGVg.js",
        "eiffel-Dze7nlu3.js",
        "elm-DG7jkhNZ.js",
        "entry-BlFLDZTz.js",
        "erlang-BO6gOnGA.js",
        "factor-CMxFHDqz.js",
        "fcl-CDDUNjTj.js",
        "forth-B9D2JCeE.js",
        "fortran-CAG2BFbe.js",
        "gas-0Aw8zDr5.js",
        "gherkin-DhZlEZiy.js",
        "groovy-CpwJiBl7.js",
        "haskell-ySd-OUo8.js",
        "haxe-7MlzfeYV.js",
        "http-BqypyemW.js",
        "idl-4HIGJlDI.js",
        "index-B3buAP4v.js",
        "index-BRdvrTbX.js",
        "index-C8IaSh72.js",
        "index-CCE0PUKm.js",
        "index-CmkVFvOk.js",
        "index-D-ZKLOk_.js",
        "index-DGiBcWgC.js",
        "index-DZ8B4Bty.js",
        "index-DigBGnoz.js",
        "index-DkUlpu9O.js",
        "index-DsFxiI9W.js",
        "index-X6C4wc_o.js",
        "index-a0KV7RN-.js",
        "index-fpDj_7_M.js",
        "index-gZR-W-XV.js",
        "index-jW8O6gmC.js",
        "javascript-Bt8B7yTi.js",
        "julia-Bs6JJhYG.js",
        "livescript-BMWCDuIE.js",
        "lua-Cvg8VrAA.js",
        "main.mjs",
        "manifest.json",
        "mathematica-DNLOL9PQ.js",
        "mbox-Ga7d4MMN.js",
        "mirc-Dma3B8rS.js",
        "mllike-DHn7xckP.js",
        "modelica-0d55jYY0.js",
        "module-C_DZUNyP.js",
        "mscgen-DdqZYINH.js",
        "mumps-Btr8VblO.js",
        "native-4xGXbtDn.js",
        "native-task-recovery-menu-qPTpusCX.js",
        "nginx-DTDtBDVN.js",
        "nsis-CyKBdPWp.js",
        "ntriples-CvgOYMpL.js",
        "octave-DYBj3-tl.js",
        "oz-R_e8WMIi.js",
        "pascal-GD8iposT.js",
        "perl-DL9mHpoi.js",
        "pig-C_4T4YIV.js",
        "powershell-B0suO7Vd.js",
        "properties-BR-vP1aU.js",
        "protobuf-BxgpyhoW.js",
        "pug-vHnWR0UE.js",
        "puppet-Bdao66PW.js",
        "python-BFGRmuZ9.js",
        "q-CrbCVq4a.js",
        "r-V7nswm59.js",
        "rpm-C-DLY-If.js",
        "ruby-CQTpZw6f.js",
        "sas-D2UG-yhZ.js",
        "scheme-BKzrkGJD.js",
        "shell-BlsXDxCn.js",
        "sieve-CjwBwOY5.js",
        "simple-mode-DMneyfDu.js",
        "smalltalk-BOIGQuhN.js",
        "solr-CwD7U71z.js",
        "sparql-DYskk2vE.js",
        "spreadsheet-Bgtt3oLP.js",
        "sql-Cei9CMfk.js",
        "styles.css",
        "stylus-BkS-boTH.js",
        "swift-FRZi1uvB.js",
        "tcl-CUcaCdmq.js",
        "textile-BnFpjsrl.js",
        "tiddlywiki-CjprD-Qp.js",
        "tiki-DK9DOeWn.js",
        "toml-BOuWGMcf.js",
        "troff-E1bJ0PPL.js",
        "ttcn-cfg-Dc39-fIP.js",
        "ttcn-tKd4HLu4.js",
        "turtle-Dq7-1WAf.js",
        "vb-Dp90gtsv.js",
        "vbscript-Bfn8O8I7.js",
        "velocity-BwIZK1TH.js",
        "verilog-CnT9bMk0.js",
        "vhdl-DCkMIyT9.js",
        "webidl-BTLTThCm.js",
        "xquery-BrBUuxMR.js",
        "yacas-b5lAVEIl.js",
        "z80-ClgwfNdB.js"
      ]
    },
    "verificationReceiptSha256": "611c414947f0a88217ae8066a18b4a8062052f8571f3a214fcbc7844d0c31c62"
  }
}
```
