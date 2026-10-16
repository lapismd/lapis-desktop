import {
  createTerminalClient,
  type TerminalTransport,
} from "@lapismd/terminal";
import { CatalogTransport } from "./colored-frames";
import { TerminalSessions } from "../../../src/lib/terminal/terminal-sessions";
import type { TerminalFactory } from "../../../src/lib/terminal/terminal-binding";
import type { App } from "@lapis-notes/api";

export type TerminalScenario =
  | "colored"
  | "normal"
  | "restored"
  | "unavailable"
  | "error"
  | "exited"
  | "high-output"
  | "disabled"
  | "safe-mode"
  | "installed-disabled"
  | "installed-copy";
export function terminalFixture(scenario: TerminalScenario) {
  const transport = new CatalogTransport(
    scenario === "colored"
      ? undefined
      : scenario === "high-output"
        ? Array.from({ length: 180 }, (_, i) => `build step ${i + 1}: complete`)
        : ["Lapis Terminal", "Unicode: café 你好 👩🏽‍💻", "$ ready"],
  );
  const dimensions: [number, number][] = [];
  const scrolls: number[] = [];
  let fail = scenario === "error";
  let typed = "";
  const input = transport.input.bind(transport);
  transport.input = async (id, data) => {
    if (fail) {
      fail = false;
      throw new Error("Terminal temporarily unavailable");
    }
    await input(id, data);
    typed += data;
    transport.output(id, [
      "Lapis Terminal",
      "Unicode: café 你好 👩🏽‍💻",
      ...typed.replaceAll("\r", "\n").split("\n"),
    ]);
  };
  const resize = transport.resize.bind(transport);
  transport.resize = async (id, columns, rows) => {
    dimensions.push([columns, rows]);
    return resize(id, columns, rows);
  };
  transport.scroll = async (_id, lines) => {
    scrolls.push(lines);
  };
  let owner: App | undefined;
  let sessions: TerminalSessions | undefined;
  const factory: TerminalFactory = (app) => {
    owner = app;
    sessions = new TerminalSessions({
      client: createTerminalClient(transport as TerminalTransport, {
        onError: (error) =>
          app.notifications.notify({
            message: error.message,
            source: "terminal",
            severity: "error",
          }),
      }),
      activate: async () => {
        if (scenario === "unavailable")
          throw new Error("Terminal service unavailable");
      },
      release: async (mode) => {
        if (mode === "close")
          for (const info of await transport.list())
            await transport.close(info.id);
      },
    });
    return sessions;
  };
  return {
    transport,
    dimensions,
    scrolls,
    factory,
    get app() {
      return owner;
    },
    get sessions() {
      return sessions;
    },
  };
}
