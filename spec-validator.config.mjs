import { defineConfig, tableRequirements } from "@lapismd/spec-validator";
import { canonicalContractPattern } from "./scripts/spec-contracts.mjs";

export default defineConfig(
  tableRequirements({
    name: "lapis-desktop",
    idPattern: "^LD-[A-Z]+-\\d{3}$",
    tableSection: "Requirements",
    ruleIds: {
      governance: "LD-GOV-001",
      summary: "LD-GOV-001",
      fileLimits: "LD-GOV-001",
      verification: "LD-GOV-001",
      book: "LD-GOV-001",
      bookIgnore: "LD-GOV-001",
      specFirst: "LD-GOV-002",
      internal: "LD-GOV-001",
    },
    validators: {
      governance: {
        acceptance: false,
        normative: true,
        references: true,
        changeMap: false,
      },
      summary: true,
      fileLimits: { maxLines: 400, maxBytes: 32768 },
      book: true,
      verification: {
        file: "current/verification.md",
        mode: "table",
        idMode: "single",
        headers: {
          ids: ["ID"],
          status: ["Status"],
          evidence: ["Evidence"],
          required: [],
        },
        statuses: ["Implemented", "Planned"],
        statusMatch: "exact",
        rowMultiplicity: "exactly-one",
        rejectOrphans: true,
        requireEvidence: true,
      },
      specFirst: {
        mode: "mapped",
        canonicalPattern: canonicalContractPattern("spec/src/"),
        protected: [
          "^(?:\\.storybook/|catalog/(?!plugins/ai/|support/ai/)|(?:vite|vitest)\\.catalog\\.config\\.ts$)",
          "^(?:src/|src-tauri/|public/|docs/|tests/|scripts/|\\.github/|index\\.html$|.*\\.(?:json|toml|yaml|mjs|ts|js)$|AGENTS\\.md$|PLAN\\.md$|POPOUT_PLAN\\.md$|MIGRATION\\.md$|README\\.md$|LICENSE\\.md$|\\.gitignore$|\\.prettierignore$|\\.node-version$|spec/src/current/progress/)",
        ],
        ignore: ["(^|/)(?:target|dist|node_modules|gen)/", "^spec/book/"],
        rules: [
          {
            pattern:
              "^(?:src/lib/native/tasks/|src-tauri/src/(?:vault/tasks\\.rs$|host/vault/tasks\\.rs$)|src-tauri/tests/core_tasks_service\\.rs$|tests/(?:renderer/(?:native-tasks\\.test\\.mjs$|tasks-)|desktop/tasks-))",
            chapters: ["spec/src/current/tasks.md"],
          },
          {
            pattern:
              "^(?:src/lib/desktop/background-work\\.ts$|tests/(?:workers/|renderer/background-work\\.test\\.mjs$)|vitest\\.workers\\.config\\.ts$|catalog/(?:plugins|support)/background/)",
            chapters: ["spec/src/current/background.md"],
          },
          {
            pattern:
              "^(?:src-tauri/src/(?:repository/|host/repository/)|src-tauri/tests/repository_.*\\.rs$|src/lib/native/repository/|src/components/repository/|tests/(?:desktop|renderer)/repository-)",
            chapters: ["spec/src/current/repository.md"],
          },
          {
            pattern:
              "^(?:config/ai/|src/(?:lib/ai/|components/ai/|lib/native/ai/)|src-tauri/(?:src/(?:ai/|host/ai/)|tests/ai_.*\\.rs$)|tests/(?:ai/|renderer/ai-|fixtures/ai/|desktop/(?:ai-|acp-))|catalog/(?:plugins/ai/|support/ai/)|vitest\\.ai\\.config\\.mjs$)",
            chapters: ["spec/src/current/ai.md"],
          },
          {
            pattern:
              "^(?:\\.storybook/|catalog/|(?:vite|vitest)\\.catalog\\.config\\.ts$)",
            chapters: ["spec/src/current/plugins.md"],
          },
          {
            pattern:
              "^(?:POPOUT_PLAN\\.md$|src-tauri/tests/workspace_windows\\.rs$|src-tauri/src/(?:windows/|host/windows/|acceptance/popouts\\.rs$)|src/lib/(?:desktop/(?:popup-|workspace-popouts)|native/workspace-windows)|tests/renderer/(?:popout-|notes-dispose)|tests/desktop/(?:popout-|PopoutProof))",
            chapters: ["spec/src/current/windows.md"],
          },
          {
            pattern:
              "^(?:src-tauri/src/(?:host/integration/|integration/|acceptance/integration\\.rs$)|src/lib/(?:desktop|native|notes)/.*integration|tests/(?:desktop|renderer)/integration-)",
            chapters: ["spec/src/current/integration.md"],
          },
          {
            pattern:
              "^(?:src/lib/notes/notes-plugins\\.ts|tests/(?:desktop/navigation-|renderer/notes-profile))",
            chapters: ["spec/src/current/navigation.md"],
          },
          {
            pattern:
              "^(?:src-tauri/src/(?:host/vault/|acceptance/actions\\.rs$|watch/|vault/(?:(?:action_targets|mutations|creates|staged|writes|resources)\\.rs|system_actions/))|src-tauri/tests/(?:system_action_targets|macos_system_actions|vault_(?:mutations|watch|creates)|watch_registry)\\.rs|src/lib/native/(?:native-bridge|file-watch|vault-client|vault-path)\\.ts|src/lib/notes/(?:notes-leave|notes-startup|notes-dispose)\\.ts|src/components/views/NotesWorkspace\\.svelte|tests/renderer/notes-leave\\.test\\.mjs|tests/desktop/system-file-actions\\.test\\.mjs|tests/renderer/native-system-actions\\.test\\.mjs|tests/(?:desktop/file-|renderer/native-file-))",
            chapters: ["spec/src/current/files.md"],
          },
          {
            pattern:
              "^(?:src/|src-tauri/|public/|tests/desktop/|tests/renderer/|index\\.html$|vite\\.config\\.ts$|svelte\\.config\\.js$)",
            chapters: ["spec/src/current/desktop.md"],
          },
          {
            pattern:
              "^(?:PLAN\\.md$|MIGRATION\\.md$|spec/migration-inventory\\.json$|spec/src/current/progress/)",
            chapters: ["spec/src/current/migration.md"],
          },
          {
            pattern:
              "^(?:scripts/|docs/|spec/book\\.toml$|tests/governance/|\\.github/|AGENTS\\.md$|README\\.md$|LICENSE\\.md$|[^/]+\\.(?:json|toml|yaml|mjs)$|\\.gitignore$|\\.prettierignore$|\\.node-version$)",
            chapters: ["spec/src/current/governance.md"],
          },
        ],
      },
    },
    plugins: ["scripts/spec-plugin.mjs"],
    documentRoles: [
      {
        pattern: canonicalContractPattern(),
        role: "contract",
      },
      { pattern: "^current/verification\\.md$", role: "verification" },
      { pattern: "^current/progress/", role: "progress" },
      { pattern: "^history/(?!index)", role: "history" },
      { pattern: "(?:index|SUMMARY)\\.md$", role: "navigation" },
    ],
    check: {
      build: true,
      first: true,
      lanes: [
        {
          name: "rust-format",
          command: "cargo",
          args: [
            "fmt",
            "--manifest-path",
            "src-tauri/Cargo.toml",
            "--",
            "--check",
          ],
        },
      ],
    },
  }),
);
