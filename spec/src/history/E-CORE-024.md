# E-CORE-024 — Actual provider reload-detach preflight

```json
{
  "id": "E-CORE-024",
  "date": "2026-10-25",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M10.2"],
  "requirements": ["LD-AI-001", "LD-AI-002", "LD-AI-004"],
  "files": ["tests/desktop/ai-core-provider.test.mjs"],
  "contractReview": "Opt-in hidden native Core transport/service preflight uses actual Codex with native credentials and isolated disposable vault/profile. Existing product behavior and defaults remain unchanged.",
  "milestoneReview": "Partial R2.3 evidence only; existing application-screen and hosted actual-provider detach/cold recovery acceptance remains open.",
  "runs": [
    {
      "name": "actual-provider-detach-reattach-cold",
      "command": "LAPIS_AI_TEST_CORE_PROVIDER=1 LAPIS_AI_TEST_RUNTIME_CONFIG=\"$PWD/.local/m10-qualification-runtime.json\" node --test --test-concurrency=1 tests/desktop/ai-core-provider.test.mjs",
      "result": "pass",
      "tests": 1,
      "failures": 0,
      "note": "33.15s; accepted then detached while Running, actual provider completed durably, reattachment and clean Quit/cold reads preserve exact transcript hash. Existing acceptance binary; no new build/intake claim."
    }
  ],
  "versions": {
    "desktopBaseline": "5f165fc9223c3e5a9cb7c7985e406f9f2b5c85d0",
    "nativeBinarySha256": "ddc936d0d5858d6efbca4326904f31d78feb72aef98b79368c34b9748d90a17c",
    "provider": "Codex ACP",
    "model": "gpt-5.6-sol",
    "mode": "read-only"
  },
  "remaining": []
}
```

Date: 2026-10-25. Requirements: LD-AI-001/002/004 and Notes LN-CORE-003/007.
This is partial R2.3 qualification; the aggregate gate remains In progress.

## Scope and exact command

The opt-in native test uses an isolated vault/profile and actual Codex ACP,
`gpt-5.6-sol`, read-only mode and one nonce-only prompt. It runs the native
WebView in background API mode without activating a window. It uses production
admission, Core turn commands, reload release and vault-close paths. It does not
mount the Notes chat screen or change the selected application default.

```sh
LAPIS_AI_TEST_CORE_PROVIDER=1 \
LAPIS_AI_TEST_RUNTIME_CONFIG="$PWD/.local/m10-qualification-runtime.json" \
node --test --test-concurrency=1 tests/desktop/ai-core-provider.test.mjs
```

The explicit runtime configuration contains only the helper bundle and adapter
search paths. Credentials remain native; no credential bytes are in receipts.
Without the opt-in flag the test skips and does not launch a provider.

## Before and after

An initial native discovery attempt used a direct awaited WebDriver script and
hit its 10-second promise boundary during admission. Reusing the existing
polling `invoke` helper resolved the harness issue without raising timeouts. The
non-prompting native preflight then passed with Core selected and Codex, Cursor
and OpenCode targets available. No product change was required.

The exploratory actual-provider scenario passes, followed by the committed leaf
test: **one pass, zero failures**, 33.15 seconds. The caller detaches after
durable acceptance while the record is still Running. With no admitted viewing
client, the actual provider completes and persists the exact nonce response.
Reattachment reads the same complete record. After normal Quit and a cold native
process, the exact record and portable transcript hash remain unchanged.

The final leaf receipt is
`.local/native-test/core-provider-detach-aZu1P4/receipt.json` with request
`d51e8e27-f904-446b-8b4f-b53fade97f36`. Its transcript SHA-256 is
`219ef86bab0c5b32f55a688d453785915634d0959de7fbc6c13b8175a752daad`. The earlier
exploratory receipt is retained at
`.local/native-test/core-provider-detach-DMMfxB/receipt.json`; it records
accepted 17:25:13.030 UTC, detached Running at 17:25:13.161, complete at
17:25:18.999 and cold retained at 17:25:33.845. Both owned processes exit
cleanly.

The existing macOS ARM64 acceptance executable has SHA-256
`ddc936d0d5858d6efbca4326904f31d78feb72aef98b79368c34b9748d90a17c`. Its existing
build/cohort evidence is E-CORE-022. This does not claim a new build or qualify
the pending Docker/Design Core/Mira dependency intake.

## Remaining gates

R2.3 still requires the actual provider through the retained application
screens, including the hosted Rust application, detach and cold recovery. The
opt-in leaf only proves the actual Tauri/Core native transport and service
lifetime. No provider matrix, app tools, hosted Linux deployment, signing or
distribution gate is closed. Renderer AI and Node serving remain the defaults.
