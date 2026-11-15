import type { App } from "@lapis-notes/api";
import type {
  RepositoryRemotesCommand,
  RepositoryRemotesSnapshot,
} from "@lapis-notes/history/repository";
import type { NativeCall } from "../../../src/lib/native/vault-client.ts";
import { createNativeRepository } from "../../../src/lib/native/repository/services.ts";
import { operationFixture } from "./operations.ts";
import { operation, revision, commit } from "./fixture.ts";
export type Scenario = "connected" | "disconnected" | "locked" | "github";
const fixtures = new WeakMap<
  HTMLElement,
  ReturnType<typeof nativeRemotesFixture>
>();
export function bindNativeRemotes(
  root: HTMLElement,
  fixture: ReturnType<typeof nativeRemotesFixture>,
) {
  fixtures.set(root, fixture);
}
export function nativeRemotesFor(canvas: HTMLElement) {
  const root = canvas.querySelector<HTMLElement>(
    "[data-native-remotes-fixture]",
  );
  const fixture = root && fixtures.get(root);
  if (!fixture) throw new Error("Native remotes fixture is not ready");
  return fixture;
}

/** Declared memory responses exercise production Desktop transport and shell. */
export function nativeRemotesFixture(scenario: Scenario) {
  const history = operationFixture("ready");
  const commands: RepositoryRemotesCommand[] = [];
  const handoffs: string[] = [];
  const snapshot: RepositoryRemotesSnapshot = {
    revision: 3,
    capabilities: {
      targets: ["backup", "original"],
      anonymousHttps: true,
      httpsTokens: scenario !== "locked",
      hostSshAgent: true,
      hostSshDefault: true,
      githubDeviceSignIn: scenario === "github",
      forgejoTokens: true,
    },
    settings: {
      host: "desktop",
      storage: scenario === "locked" ? "locked" : "available",
      sshAvailable: true,
      deviceSignInAvailable: scenario === "github",
      credentials: [],
      automaticSync: false,
      authorization: undefined,
      targets: (["backup", "original"] as const).map((target) => ({
        target,
        connection:
          scenario === "disconnected"
            ? null
            : {
                name: "origin",
                url: `ssh://git@git.example.test/team/${target}.git`,
                branch: "main",
                bookmark: target === "original" ? "main" : "lapis-backup",
                authentication: "ssh-agent",
                credential: "",
              },
        status: scenario === "disconnected" ? "disconnected" : "connected",
        bookmarks: target === "original" ? ["main"] : [],
        canFetch: scenario !== "disconnected",
        canPush: scenario !== "disconnected",
        observation:
          scenario !== "disconnected"
            ? { incoming: 2, outgoing: 1, fetchedAt: "2026-11-15T12:00:00Z" }
            : undefined,
      })),
    },
  };
  const saved = commit();
  const backup = {
    phase: "ready" as const,
    checkpoint: {
      operation,
      commit: revision,
      change_id: saved.change_id,
      description: "Saved work",
      timestamp_millis: 1794748800000,
    },
    error: null,
  };
  const workingCopy = JSON.stringify({
    version: 1,
    source: "original",
    operation,
    working_copy: revision,
    workspace: "default",
    commit: {
      change_id: saved.change_id,
      description: "Saved work",
      author: {
        name: "Ada",
        email: "ada@example.test",
        timestamp: { millis: "1794748800000", offset_minutes: 0 },
      },
    },
    files: 3,
    lines: { additions: 7, deletions: 2 },
    uncounted: 0,
  });
  const call: NativeCall = async <T>(
    name: string,
    args: Parameters<NativeCall>[1],
  ) => {
    if (
      args &&
      (Array.isArray(args) ||
        args instanceof Uint8Array ||
        args instanceof ArrayBuffer)
    )
      throw new Error("Catalog commands require record arguments");
    let result: unknown;
    if (name === "desktop_repository_remotes") {
      const command = (
        args?.request as { command: RepositoryRemotesCommand | null }
      ).command;
      if (command) {
        if (command.expectedRevision !== snapshot.revision)
          throw new Error("Stale catalog connection");
        commands.push(structuredClone(command));
        if ("target" in command) {
          const target = snapshot.settings.targets.find(
            (t) => t.target === command.target,
          )!;
          if (command.kind === "fetch")
            target.observation = {
              incoming: 0,
              outgoing: 1,
              fetchedAt: "2026-11-15T12:01:00Z",
            };
          else if (command.kind === "review_push")
            target.review = {
              id: "reviewed-update",
              commit: revision,
              summary: "Publish the explicitly selected bookmark",
              outgoing: 1,
              remoteCommit: null,
            };
          else if (command.kind === "save_connection") {
            target.connection = command.connection;
            target.status = "connected";
            target.canFetch = target.canPush = true;
            snapshot.revision++;
          } else if (command.kind !== "test_connection")
            throw new Error("Catalog publication is not selected");
        } else if (command.kind === "begin_sign_in")
          snapshot.settings.authorization = {
            state: "pending",
            code: "CURRENT-CODE",
            url: "https://github.com/login/device",
          };
        else throw new Error("Catalog custody is not selected");
      }
      result = structuredClone(snapshot);
    } else if (name === "desktop_repository_synchronization")
      result = {
        revision: snapshot.revision,
        enabled: false,
        busy: false,
        phase: "paused",
        recovery: false,
      };
    else if (name === "desktop_repository_working_copy") result = workingCopy;
    else if (name === "desktop_clipboard_write")
      handoffs.push(`copy:${args?.text}`);
    else if (name === "desktop_external_open")
      handoffs.push(`open:${args?.url}`);
    else if (name !== "desktop_repository_release")
      throw new Error(`Unselected catalog command: ${name}`);
    return result as T;
  };
  return {
    commands,
    handoffs,
    services(app: App) {
      const service = createNativeRepository(
        {
          sessionId: "catalog-session",
          profileId: "catalog-profile",
          path: "/catalog",
          name: "Review vault",
          resourceToken: "catalog-resources",
        },
        call,
        undefined,
        app,
      );
      return {
        remotes: service.remotes,
        workingCopy: service.workingCopy,
        reader: history.reader,
        original: history.reader,
        sources: async () => ({ original: true }),
        backup: {
          start: async () => backup,
          capture: async () => backup,
          stop: async () => {},
        },
        async close(mode: "close" | "reload") {
          await service.close(mode);
          await history.close();
        },
      };
    },
  };
}
