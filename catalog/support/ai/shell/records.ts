// SPDX-License-Identifier: Apache-2.0
// Retained lapis-plugins ee20d366 shell fixtures; see src/lib/ai/NOTICE.md.
export function conversationFiles(input: {
  id: string;
  title: string;
  scopeDir?: string;
  status: "active" | "archived";
  bindings: Array<Record<string, unknown>>;
  activeBindingId: string;
  transcript: Array<Record<string, unknown>>;
  usage?: { used: number; limit: number };
  malformedFinalLine?: boolean;
}): Record<string, string> {
  const root = [
    input.scopeDir ?? "Notes",
    ".lapis",
    "agents",
    "sessions",
    input.id,
  ]
    .filter(Boolean)
    .join("/");
  const agents = [
    ...input.bindings,
    ...(input.usage
      ? [
          {
            schemaVersion: 1,
            type: "usage.updated",
            id: `usage-${input.id}`,
            createdAt: "2026-08-16T09:03:00.000Z",
            agentBindingId: input.activeBindingId,
            usage: input.usage,
          },
        ]
      : []),
  ];
  const transcript = input.transcript
    .map((entry) => JSON.stringify(entry))
    .join("\n");
  return {
    [`${root}/metadata.yaml`]: [
      "schemaVersion: 1",
      `id: ${input.id}`,
      `title: ${JSON.stringify(input.title)}`,
      'createdAt: "2026-08-16T09:00:00.000Z"',
      'updatedAt: "2026-08-16T10:03:00.000Z"',
      `activeAgentBindingId: ${input.activeBindingId}`,
      `status: ${input.status}`,
      "",
    ].join("\n"),
    [`${root}/agents.jsonl`]: `${agents
      .map((entry) => JSON.stringify(entry))
      .join("\n")}\n`,
    [`${root}/transcript.jsonl`]: `${transcript}\n${
      input.malformedFinalLine ? '{"schemaVersion":1,"type":"message"' : ""
    }`,
  };
}

export function binding(id: string, agent: "codex" | "cursor", model: string) {
  return {
    schemaVersion: 1,
    type: "binding.created",
    id,
    createdAt: "2026-08-16T09:00:00.000Z",
    runtime: "acp",
    agent,
    model: { provider: agent, model },
    thinking: "medium",
  };
}

export function message(
  id: string,
  role: "user" | "assistant",
  text: string,
  agentBindingId: string,
) {
  return {
    schemaVersion: 1,
    id,
    type: "message",
    role,
    text,
    createdAt: "2026-08-16T09:01:00.000Z",
    agentBindingId,
  };
}
