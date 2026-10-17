# Retained AI policy coverage

Source: `lapis-plugins` tree `56b5d6c1` (unchanged at `9953da14`). Destination
tests retain the applicable source cases below. Imports move to owned
implementations, including split record validators. Native-specific expectation
changes are recorded below. Desktop-specific safety cases remain in
`tests/renderer/ai-*.test.mjs`. This inventory does not qualify native product
behavior or migrated UI stories.

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
| commands/agent.test.ts                        | commands/agent.test.ts                        |
| commands/discovery.test.ts                    | commands/discovery.test.ts                    |
| commands/inspect.test.ts                      | commands/inspect.test.ts                      |
| commands/markdown.test.ts                     | commands/markdown.test.ts                     |
| commands/parser.test.ts                       | commands/parser.test.ts                       |
| commands/router.test.ts                       | commands/router.test.ts                       |
| commands/seed.test.ts                         | commands/seed.test.ts                         |
| bootstrap/build.test.ts                       | bootstrap/build.test.ts                       |
| chat/chat-mentions.test.ts                    | chat/chat-mentions.test.ts                    |
| chat/chat-trace.test.ts                       | chat/chat-trace.test.ts                       |
| chat/chat-session.test.ts                     | chat/chat-session.test.ts                     |
| chat/chat-time.test.ts                        | chat/chat-time.test.ts                        |
| chat/chat-status.test.ts                      | chat/chat-status.test.ts                      |
| chat/chat-result-views.test.ts                | chat/chat-result-views.test.ts                |
| chat/composer-model-catalog.test.ts           | chat/composer-model-catalog.test.ts           |
| sessions/session-store.test.ts                | sessions/session-store.test.ts                |
| sessions/plugin-data.test.ts                  | sessions/plugin-data.test.ts                  |
| conversations/transcript-projection.test.ts   | conversations/transcript-projection.test.ts   |
| settings/acp-agents.test.ts                   | settings/acp-agents.test.ts                   |
| tools/mcp-server-registry.test.ts             | tools/mcp-server-registry.test.ts             |

The Node Vitest lane transforms the built public API and UI helpers as Vite does
in the app; it adds no source alias, replacement package or production loader.
It mounts no UI, starts no model, reads no credentials and uses disposable
in-memory vaults. Original story coverage remains a separate gate in
`catalog/COVERAGE.md`.

The session-store interrupted-tool case now requires an error state and an
explicit unknown-outcome message instead of a completed tool. Its settled
thinking assertion remains. This matches LD-AI-002 and adds a stronger native
recovery expectation; it does not waive an existing functional check.
