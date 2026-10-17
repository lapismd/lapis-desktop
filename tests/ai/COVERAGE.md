# Retained AI policy coverage

Source: `lapis-plugins` tree `56b5d6c1` (unchanged at `9953da14`). Destination
tests retain all applicable cases and assertions in the suites below; only
public implementation imports move, including split record validators.
Desktop-specific safety cases remain in `tests/renderer/ai-*.test.mjs`. This
inventory does not qualify native product behavior or migrated UI stories.

| Source under `packages/ai/src/lib`            | Destination under `tests/ai`                  |
| --------------------------------------------- | --------------------------------------------- |
| skills/discovery.test.ts                      | skills/discovery.test.ts                      |
| skills/manifest.test.ts                       | skills/manifest.test.ts                       |
| skills/parser.test.ts                         | skills/parser.test.ts                         |
| skills/seed.test.ts                           | skills/seed.test.ts                           |
| conversations/conversation-repository.test.ts | conversations/conversation-repository.test.ts |
| conversations/vault-transcript-store.test.ts  | conversations/vault-transcript-store.test.ts  |
| conversations/validation.test.ts              | conversations/validation.test.ts              |
| conversations/approval-grants.test.ts         | conversations/approval-grants.test.ts         |
| conversations/redaction.test.ts               | conversations/redaction.test.ts               |
| conversations/context-handoff.test.ts         | conversations/context-handoff.test.ts         |

The Node Vitest lane transforms the built public API as Vite does in the app; it
adds no source alias, replacement package or production loader. It mounts no UI,
starts no model, reads no credentials and uses disposable in-memory vaults.
Original story coverage remains a separate gate in `catalog/COVERAGE.md`.
