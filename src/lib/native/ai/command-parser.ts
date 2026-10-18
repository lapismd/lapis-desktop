import {
  CommandParseError,
  type ParsedCommandFile,
} from "../../ai/commands/markdown.ts";
import {
  CommandWorkerError,
  type CommandParser,
  type ParseReply,
} from "../../ai/commands/parser-port.ts";

type Pending = {
  path: string;
  resolve(value: ParsedCommandFile): void;
  reject(error: unknown): void;
  timer: ReturnType<typeof setTimeout>;
};
export class NativeCommandParser {
  readonly #create: () => Worker;
  readonly #pending = new Map<number, Pending>();
  #worker?: Worker;
  #sequence = 0;
  #closed = false;
  #failure?: CommandWorkerError;
  constructor(
    create = () =>
      new Worker(new URL("./command-parser.worker.ts", import.meta.url), {
        type: "module",
        name: "lapis-command-parser",
      }),
  ) {
    this.#create = create;
  }
  readonly parse: CommandParser = (content, path, name) => {
    if (this.#closed)
      return Promise.reject(new CommandWorkerError("Command parser is closed"));
    if (this.#failure) return Promise.reject(this.#failure);
    try {
      if (!this.#worker) {
        this.#worker = this.#create();
        this.#worker.onmessage = ({ data }: MessageEvent<ParseReply>) =>
          this.#receive(data);
        this.#worker.onerror = (event) => {
          event.preventDefault();
          this.#fail("Command parser worker failed");
        };
        this.#worker.onmessageerror = () =>
          this.#fail("Command parser reply could not be read");
      }
      const id = ++this.#sequence;
      return new Promise<ParsedCommandFile>((resolve, reject) => {
        const timer = setTimeout(
          () => this.#fail("Command parsing timed out"),
          15_000,
        );
        this.#pending.set(id, { resolve, reject, path, timer });
        try {
          this.#worker!.postMessage({ id, content, path, name });
        } catch {
          this.#fail("Command parser request could not be sent");
        }
      });
    } catch {
      this.#fail("Command parser worker could not start");
      return Promise.reject(this.#failure);
    }
  };
  #receive(reply: ParseReply): void {
    const request = this.#pending.get(reply.id);
    if (!request) return;
    clearTimeout(request.timer);
    this.#pending.delete(reply.id);
    if (reply.data) request.resolve(reply.data);
    else if (reply.error)
      request.reject(
        reply.error.name === "CommandParseError"
          ? new CommandParseError(request.path, reply.error.message)
          : new Error(reply.error.message),
      );
    else {
      request.reject(new CommandWorkerError("Invalid command parser reply"));
      this.#fail("Invalid command parser reply");
    }
  }
  #fail(message: string): void {
    this.#failure = new CommandWorkerError(message);
    this.#worker?.terminate();
    this.#worker = undefined;
    for (const job of this.#pending.values()) {
      clearTimeout(job.timer);
      job.reject(this.#failure);
    }
    this.#pending.clear();
  }
  close(): void {
    this.#closed = true;
    this.#fail("Command parser is closed");
  }
}
