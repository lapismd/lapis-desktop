import type { ExecutionMode } from "../../../src/lib/ai/core/agent-profile.ts";
/** Deliberate fixture capabilities; these never assert a real provider's modes. */
export const reviewExecutionModes: ExecutionMode[] = [
  {
    id: "read-only",
    name: "Ask before actions",
    description: "Review actions before allowing them.",
  },
  {
    id: "fixture-edit",
    name: "Workspace edits",
    description: "Simulated provider mode for reviewing this picker.",
  },
];
