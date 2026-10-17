import {
  App,
  FileTextPersistence,
  MemoryAppDatabase,
  MemoryVaultAdapter,
  installApplicationCompatibility,
  type TFile,
  type FileEditingSession,
} from "@lapis-notes/api";
import { registerCatalogCleanup } from "../lifecycle.ts";
import { reviewLayout } from "./layout.ts";

export type ConflictScenario =
  | "modified"
  | "deleted"
  | "unreadable"
  | "read-only"
  | "busy";

export function createConflictFixture(scenario: ConflictScenario) {
  const adapter = new MemoryVaultAdapter({ "Note.md": "# Original note\n" });
  const database = new MemoryAppDatabase(crypto.randomUUID());
  const app = new App({
    version: "0.1.0-catalog",
    adapter,
    appDatabase: database,
    markdownRenderer: async () => {},
    workspaceShell: { application: { name: "Lapis Notes" } },
  });
  const compatibility = installApplicationCompatibility(app);
  let local = "# My unsaved draft\n";
  let dirty = false;
  let fault = true;
  const recoveries = new Set<Promise<void>>();
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  if (scenario !== "busy") release();
  const denied = () =>
    Object.assign(new Error("The note is read-only"), { code: "EACCES" });
  const writer: FileEditingSession = {
    get dirty() {
      return dirty;
    },
    flush: () => persistence.persist(local),
    protect: async () => () => {},
  };
  let unregisterWriter = () => {};
  let persistence: FileTextPersistence;
  const ready = (async () => {
    await app.vault.load();
    await app.vault.mkpath(".lapis");
    await app.configuration.load();
    await app.workspace.changeLayout(reviewLayout());
    const file = app.vault.getFileByPath("Note.md");
    if (!file) throw new Error("The conflict fixture note is missing");
    persistence = new FileTextPersistence({
      file,
      baseline: "# Original note\n",
      conflicts: app.fileEditingSessions.textConflicts,
      local: () => local,
      vault: {
        read: (target: TFile) =>
          fault && scenario === "unreadable"
            ? Promise.reject(denied())
            : app.vault.read(target),
        // Disposable service port: native atomic publication stays a native gate.
        modifyIfUnchanged: async (target, content, expected) => {
          if (fault && scenario === "read-only") throw denied();
          const actual = (await adapter.exists(target.path))
            ? await adapter.read(target.path)
            : null;
          if (actual !== expected)
            throw Object.assign(new Error("The note changed on disk"), {
              code: "ECONFLICT",
            });
          await adapter.write(target.path, content);
        },
      },
      serialize: (run) => app.fileEditingSessions.recover(writer, run),
      protect: async () => {
        let finish!: () => void;
        const settled = new Promise<void>((resolve) => {
          finish = resolve;
        });
        recoveries.add(settled);
        await held;
        return {
          release() {
            recoveries.delete(settled);
            finish();
          },
          saved: () => {
            dirty = false;
          },
          reset: (text) => {
            local = text;
            dirty = false;
          },
        };
      },
    });
    dirty = true;
    unregisterWriter = app.fileEditingSessions.register("Note.md", writer);
    if (scenario === "deleted") await adapter.remove(file.path);
    else if (scenario !== "read-only")
      await adapter.write(file.path, "# Changed outside Lapis\n");
    try {
      await persistence.persist(local);
    } catch (error) {
      if (!persistence.hasConflict)
        await persistence.rejectPersistence(error).catch(() => {});
    }
    if (!persistence.hasConflict)
      throw new Error("Expected a retained conflict");
  })();
  let closing: Promise<void> | undefined;
  const close = () =>
    (closing ??= (async () => {
      release();
      fault = false;
      await ready;
      await Promise.all([...recoveries]);
      await app.fileEditingSessions.settleOperations();
      const conflict = app.fileEditingSessions.textConflicts.entries[0];
      if (conflict) {
        await conflict.refresh();
        await app.fileEditingSessions.textConflicts.entries[0]?.resolve(
          "use-external",
        );
      }
      unregisterWriter();
      await app.workspace.disposeWorkspaceHost();
      await app.fileEditingSessions.dispose();
      await app.metadataCache.dispose();
      await database.close();
      compatibility();
    })());
  const unregister = registerCatalogCleanup(close);
  return {
    app,
    ready,
    adapter,
    release,
    close: async () => {
      unregister();
      await close();
    },
  };
}

type ConflictFixture = ReturnType<typeof createConflictFixture>;
const fixtures = new WeakMap<HTMLElement, ConflictFixture>();
export function registerConflictFixture(
  root: HTMLElement,
  fixture: ConflictFixture,
) {
  fixtures.set(root, fixture);
  return () => {
    fixtures.delete(root);
  };
}
export function conflictFixture(canvas: HTMLElement): ConflictFixture {
  const root = canvas.querySelector<HTMLElement>(
    '[data-testid="desktop-conflict-review"]',
  );
  const fixture = root && fixtures.get(root);
  if (!fixture) throw new Error("The owned conflict fixture is unavailable");
  return fixture;
}
