import type { App } from "@lapis-notes/api";
import { nativeNotesPorts } from "../ai/native-notes.ts";
import { operationFixture } from "../repository/operations.ts";
import { CommandWorkerError } from "../../../src/lib/ai/commands/parser-port.ts";
function gate() {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { pending, release };
}
export function backgroundFixture(failParsing = false) {
  const commands = gate(),
    history = gate();
  const ports = nativeNotesPorts();
  const repository = operationFixture();
  const status = repository.reader.status;
  repository.reader.status = async (handle) => {
    await history.pending;
    return status(handle);
  };
  return {
    get app() {
      return ports.app!;
    },
    releaseCommands: commands.release,
    releaseHistory: history.release,
    release() {
      commands.release();
      history.release();
    },
    createAi(app: App) {
      const services = ports.create(app);
      const store = services.userAgents!;
      return {
        ...services,
        ...(failParsing
          ? {
              parseCommand: () => {
                throw new CommandWorkerError("Command parser worker failed");
              },
            }
          : {}),
        userAgents: {
          list: async () => {
            await commands.pending;
            return store.list();
          },
          exists: (name: string) => store.exists(name),
          write: (name: string, content: string) => store.write(name, content),
          createIfMissing: (name: string, content: string) =>
            store.createIfMissing!(name, content),
        },
      };
    },
    createRepository: () => ({
      reader: repository.reader,
      close: () => repository.close(),
    }),
  };
}
type Fixture = ReturnType<typeof backgroundFixture>;
const contexts = new WeakMap<Element, Fixture>();
export function registerBackground(root: Element, fixture: Fixture) {
  contexts.set(root, fixture);
  return () => contexts.delete(root);
}
export function backgroundContext(canvas: Element): Fixture {
  const root = canvas.querySelector("[data-background-review]");
  const context = root && contexts.get(root);
  if (!context) throw new Error("Background review fixture is unavailable");
  return context;
}
