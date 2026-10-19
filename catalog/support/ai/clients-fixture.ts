import {
  AgentClients,
  type ClientStatus,
} from "../../../src/lib/ai/settings/clients.svelte.ts";
export function clientsFixture(
  report: (error: unknown) => void,
  scenario: string,
) {
  let request = "";
  let installed = scenario === "clients-ready";
  const status = (): ClientStatus => ({
    install_supported: true,
    install_unavailable: null,
    node_version: "24.18.0",
    npm_available: true,
    pending: null,
    runtimes: [
      {
        id: "codex",
        label: "Codex",
        state: installed ? "ready" : "update_available",
        detail:
          "Codex CLI and ACP adapter. Authenticate with Codex before connecting.",
        adapter_version: installed ? "1.13.1" : "1.12.0",
        cli_version: "0.156.1",
        managed: true,
        action: installed ? null : "update",
        target_version: "1.13.1",
        target_cli_version: "0.156.1",
        guide_url: "https://developers.openai.com/codex/cli",
      },
      {
        id: "cursor",
        label: "Cursor",
        state: "not_admitted",
        detail:
          "Cursor supplies its own ACP runtime. Execution is not yet admitted by this Desktop profile.",
        adapter_version: null,
        cli_version: null,
        managed: false,
        action: null,
        target_version: null,
        target_cli_version: null,
        guide_url: "https://cursor.com/docs/cli/installation",
      },
      {
        id: "local",
        label: "Lapis AI",
        state: "ready",
        detail:
          "Verified ACP, agent, coding tools and compute helpers shipped with the application.",
        adapter_version: null,
        cli_version: null,
        managed: true,
        action: null,
        target_version: null,
        target_cli_version: null,
        guide_url: "https://lapis.md",
      },
    ],
  });
  return new AgentClients(
    {
      async status() {
        if (scenario === "clients-loading") await new Promise<void>(() => {});
        if (scenario === "clients-error")
          throw new Error("Fixture client discovery failed");
        return status();
      },
      async install(id) {
        request = id;
        return {
          request_id: id,
          runtime_id: "codex",
          state: "installing",
          error: null,
        };
      },
      async outcome(id) {
        if (id !== request) throw new Error("Wrong fixture request");
        installed = true;
        return {
          request_id: id,
          runtime_id: "codex",
          state: "completed",
          error: null,
        };
      },
    },
    report,
    () => ({ complete() {}, fail() {} }),
  );
}
