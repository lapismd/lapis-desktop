import { invoke } from "@tauri-apps/api/core";
import type {
  UserAgentsCommandFile,
  UserAgentsCommandStore,
} from "../../ai/commands/user-agents.ts";
import { OwnedAiWork } from "../../ai/core/owned-work.ts";
import { nativeError } from "../native-error.ts";
import type { NativeCall } from "../vault-client.ts";

type Operation =
  | { type: "list" }
  | { type: "exists"; name: string }
  | { type: "write" | "createIfMissing"; name: string; content: string };
type Inventory = { root: string; files: UserAgentsCommandFile[] };
const POLL_MS = 1000;

export class NativeUserAgentsStore implements UserAgentsCommandStore {
  readonly #work = new OwnedAiWork();
  readonly #listeners = new Set<() => void>();
  #root?: string;
  #closed = false;
  #files?: UserAgentsCommandFile[];
  #snapshot?: string;
  #readEpoch = 0;
  #generation = 0;
  #lastFailure?: string;
  #timer?: ReturnType<typeof setInterval>;
  #polling?: Promise<void>;
  constructor(
    private readonly sessionId: string,
    private readonly call: NativeCall = invoke,
    private readonly report: (error: unknown) => void = console.error,
  ) {}
  get root(): string | undefined {
    return this.#root;
  }
  async #request<T>(operation: Operation): Promise<T> {
    if (this.#closed) throw new Error("AI user commands are closed");
    return this.#work.run(async () => {
      try {
        return await this.call<T>("desktop_ai_user_commands", {
          sessionId: this.sessionId,
          operation,
        });
      } catch (error) {
        throw nativeError(error);
      }
    });
  }
  async list(): Promise<UserAgentsCommandFile[]> {
    const epoch = ++this.#readEpoch;
    const result = await this.#request<Inventory>({ type: "list" });
    if (!this.#closed && epoch === this.#readEpoch) {
      this.#root = result.root;
      this.#remember(result.files);
    }
    return result.files;
  }
  exists(name: string): Promise<boolean> {
    return this.#request({ type: "exists", name });
  }
  async write(name: string, content: string): Promise<void> {
    ++this.#readEpoch;
    await this.#request({ type: "write", name, content });
    this.#acknowledged(name, content);
  }
  async createIfMissing(name: string, content: string): Promise<boolean> {
    ++this.#readEpoch;
    const created = await this.#request<boolean>({
      type: "createIfMissing",
      name,
      content,
    });
    if (created) this.#acknowledged(name, content);
    return created;
  }
  #remember(files: UserAgentsCommandFile[]): void {
    this.#files = files.map(({ name, content }) => ({ name, content }));
    this.#files.sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
    );
    this.#snapshot = JSON.stringify(this.#files);
  }
  #acknowledged(name: string, content: string): void {
    ++this.#readEpoch;
    if (this.#closed) return;
    if (this.#files)
      this.#remember([
        ...this.#files.filter((file) => file.name !== name),
        { name, content },
      ]);
    this.#notify();
  }
  #notify(): void {
    if (this.#closed) return;
    for (const listener of this.#listeners) {
      try {
        listener();
      } catch (error) {
        this.#report(error);
      }
    }
  }
  #report(error: unknown): void {
    try {
      this.report(error);
    } catch (reporting) {
      console.error("AI command refresh reporting failed", reporting);
    }
  }
  subscribe(listener: () => void): () => void {
    if (this.#closed) return () => {};
    this.#listeners.add(listener);
    if (this.#timer === undefined) {
      const generation = ++this.#generation;
      this.#timer = setInterval(() => {
        if (!this.#polling)
          this.#polling = this.#poll(generation).finally(() => {
            this.#polling = undefined;
          });
      }, POLL_MS);
    }
    return () => {
      this.#listeners.delete(listener);
      if (!this.#listeners.size) this.#stopWatching();
    };
  }
  #stopWatching(): void {
    ++this.#generation;
    clearInterval(this.#timer);
    this.#timer = undefined;
  }
  async #poll(generation: number): Promise<void> {
    const epoch = ++this.#readEpoch;
    try {
      const result = await this.#request<Inventory>({ type: "list" });
      if (this.#closed || generation !== this.#generation) return;
      this.#lastFailure = undefined;
      if (epoch !== this.#readEpoch) return;
      const previous = this.#snapshot;
      this.#root = result.root;
      this.#remember(result.files);
      if (previous !== undefined && previous !== this.#snapshot) this.#notify();
    } catch (error) {
      if (
        this.#closed ||
        generation !== this.#generation ||
        epoch !== this.#readEpoch
      )
        return;
      const failure = String(error);
      if (failure !== this.#lastFailure) {
        this.#lastFailure = failure;
        this.#report(error);
      }
    }
  }
  async close(): Promise<void> {
    this.#closed = true;
    this.#stopWatching();
    this.#listeners.clear();
    await Promise.all([this.#work.settle(), this.#polling]);
  }
}
