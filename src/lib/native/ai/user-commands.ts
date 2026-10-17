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

export class NativeUserAgentsStore implements UserAgentsCommandStore {
  readonly #work = new OwnedAiWork();
  readonly #listeners = new Set<() => void>();
  #root?: string;
  #closed = false;
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
    const result = await this.#request<Inventory>({ type: "list" });
    if (!this.#closed) this.#root = result.root;
    return result.files;
  }
  exists(name: string): Promise<boolean> {
    return this.#request({ type: "exists", name });
  }
  async write(name: string, content: string): Promise<void> {
    await this.#request({ type: "write", name, content });
    this.#notify();
  }
  async createIfMissing(name: string, content: string): Promise<boolean> {
    const created = await this.#request<boolean>({
      type: "createIfMissing",
      name,
      content,
    });
    if (created) this.#notify();
    return created;
  }
  #notify(): void {
    if (this.#closed) return;
    for (const listener of this.#listeners) {
      try {
        listener();
      } catch (error) {
        this.report(error);
      }
    }
  }
  subscribe(listener: () => void): () => void {
    if (this.#closed) return () => {};
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }
  async close(): Promise<void> {
    this.#closed = true;
    this.#listeners.clear();
    await this.#work.settle();
  }
}
