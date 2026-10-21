import type { CapturedSession } from "../../../../src/lib/ai/conversations/import-types.ts";
export const sampleCapture: CapturedSession = {
  version: 1,
  source: {
    kind: "codex",
    profile: "codex-cli-0.156.1",
    sessionKey: "a".repeat(64),
    snapshotKey: "b".repeat(64),
  },
  createdAt: "2026-10-19T09:00:00.000Z",
  entries: [
    {
      id: "record-1",
      createdAt: "2026-10-19T09:00:00.000Z",
      type: "message",
      role: "user",
      text: "<recommended_plugins>\nAvailable helpers from the **captured session**.\n\n- Notes search\n- Weekly review\n</recommended_plugins>\n\n<environment_context>\n<cwd>$WORKSPACE</cwd>\n\n<workspace_roots>\n<root>$WORKSPACE/Notes</root>\n</workspace_roots>\n</environment_context>\n\nReview the weekly note structure",
    },
    {
      id: "record-2",
      createdAt: "2026-10-19T09:00:02.000Z",
      type: "tool",
      name: "read_file",
      state: "unknown",
      input: '{"path":"<workspace>/Notes/weekly.md"}',
      output: "# Weekly review\n\nCapture decisions and follow-ups.",
    },
    {
      id: "record-3",
      createdAt: "2026-10-19T09:00:08.000Z",
      type: "message",
      role: "assistant",
      text: "## A focused weekly review\n\nKeep decisions close to the notes they affect.\n\n| Section | Purpose |\n| --- | --- |\n| Decisions | Record the outcome and its source |\n| Follow-ups | Link the next action |\n\n```markdown\n# Weekly review\n\n- [ ] Link unresolved decisions\n```\n\nThis is captured history from the selected Codex session.",
    },
  ],
};
