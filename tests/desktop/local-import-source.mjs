import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";
const answer =
  "## Native import answer\n\n| Status | Note |\n| --- | --- |\n| Captured | Local only |\n\n```markdown\n# Preserved native note\n```";
export function localImportSource(root, vault, kind) {
  const home = join(root, "import-home"),
    session = "12345678-1234-1234-1234-123456789abc";
  if (kind === "codex") {
    const path = join(home, ".codex/sessions/2026/10/19/rollout.jsonl");
    mkdirSync(dirname(path), { recursive: true });
    const records = [
      {
        type: "session_meta",
        payload: {
          id: session,
          cwd: vault,
          cli_version: "0.156.1",
          source: "vscode",
          originator: "lapis-acp",
        },
      },
      {
        type: "response_item",
        payload: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: "Review a captured note" }],
        },
      },
      {
        type: "response_item",
        payload: {
          type: "function_call",
          call_id: "read-note",
          name: "read_file",
          arguments: JSON.stringify({ path: join(vault, "Keep.md") }),
        },
      },
      {
        type: "response_item",
        payload: {
          type: "function_call_output",
          call_id: "read-note",
          output: "# Preserved native note",
        },
      },
      {
        type: "response_item",
        payload: {
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: answer }],
        },
      },
      {
        type: "response_item",
        payload: {
          type: "reasoning",
          encrypted_content: "NEVER-IMPORT-PRIVATE-REASONING",
        },
      },
    ];
    writeFileSync(
      path,
      records
        .map((record, i) =>
          JSON.stringify({
            timestamp: `2026-10-19T09:00:0${i}.000Z`,
            ...record,
          }),
        )
        .join("\n") + "\n",
    );
    return path;
  }
  if (kind === "cursor") {
    const project = vault
      .replace(/[^A-Za-z0-9]/gu, "-")
      .replace(/^-+|-+$/gu, "");
    const workspace = join(
      home,
      "Library/Application Support/Cursor/User/workspaceStorage/fixture/workspace.json",
    );
    mkdirSync(dirname(workspace), { recursive: true });
    writeFileSync(
      workspace,
      JSON.stringify({ folder: pathToFileURL(vault).href }),
    );
    const path = join(
      home,
      `.cursor/projects/${project}/agent-transcripts/${session}.jsonl`,
    );
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(
      path,
      [
        {
          role: "user",
          message: {
            content: [{ type: "text", text: "Review a captured note" }],
          },
        },
        {
          role: "assistant",
          message: {
            content: [
              { type: "text", text: answer },
              {
                type: "tool_use",
                id: "read-note",
                name: "read_file",
                input: { path: join(vault, "Keep.md") },
              },
              { type: "thinking", thinking: "NEVER-IMPORT-PRIVATE-REASONING" },
            ],
          },
        },
        {
          role: "user",
          message: {
            content: [
              {
                type: "tool_result",
                tool_use_id: "read-note",
                content: "# Preserved native note",
              },
            ],
          },
        },
      ]
        .map(JSON.stringify)
        .join("\n") + "\n",
    );
    return path;
  }
  const path = join(home, ".local/share/opencode/opencode.db");
  mkdirSync(dirname(path), { recursive: true });
  const database = new DatabaseSync(path);
  database.exec(
    "PRAGMA journal_mode=DELETE; CREATE TABLE session(id TEXT PRIMARY KEY,directory TEXT,title TEXT,version TEXT,time_created INTEGER,time_updated INTEGER); CREATE TABLE message(id TEXT PRIMARY KEY,session_id TEXT,time_created INTEGER,time_updated INTEGER,data TEXT); CREATE TABLE part(id TEXT PRIMARY KEY,message_id TEXT,session_id TEXT,time_created INTEGER,time_updated INTEGER,data TEXT);",
  );
  database
    .prepare(
      "INSERT INTO session VALUES ('ses_fixture',?,'Native import fixture','1.18.31',1792390800000,1792390800001)",
    )
    .run(vault);
  database
    .prepare(
      "INSERT INTO message VALUES ('msg_one','ses_fixture',1792390800000,1792390800000,?)",
    )
    .run(JSON.stringify({ role: "user" }));
  database
    .prepare(
      "INSERT INTO message VALUES ('msg_two','ses_fixture',1792390800001,1792390800001,?)",
    )
    .run(JSON.stringify({ role: "assistant" }));
  const statement = database.prepare(
    "INSERT INTO part VALUES (?,?,'ses_fixture',1792390800000,1792390800000,?)",
  );
  for (const [id, msg, data] of [
    ["prt_one", "msg_one", { type: "text", text: "Review a captured note" }],
    ["prt_two", "msg_two", { type: "text", text: answer }],
    [
      "prt_three",
      "msg_two",
      {
        type: "tool",
        tool: "read_file",
        state: {
          status: "running",
          input: { path: join(vault, "Keep.md") },
          output: "# Preserved native note",
        },
      },
    ],
    [
      "prt_four",
      "msg_two",
      { type: "reasoning", text: "NEVER-IMPORT-PRIVATE-REASONING" },
    ],
  ])
    statement.run(id, msg, JSON.stringify(data));
  database.close();
  return path;
}
