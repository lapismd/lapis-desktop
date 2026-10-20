import { OwnedAiWork } from "../core/owned-work.ts";
import type { AgentRecipientOption } from "./recipients.ts";
import type {
  ConversationBackendPort,
  OpenedConversationBackend,
  PreparedConversation,
} from "./backend-port.ts";
import { CanonicalConversationCatalog } from "./canonical-catalog.ts";
import { NativeConversationReader } from "./native-reader.ts";

export type NativeConversationReaderLease = {
  readonly reader: NativeConversationReader;
  readonly opened: OpenedConversationBackend;
  close(): Promise<void>;
};
/** One App owns the backend; individual panes own only their read resources. */
export class NativeConversationWorkspace {
  readonly #work = new OwnedAiWork();
  readonly #readers = new Set<NativeConversationReader>();
  readonly #turns = new Set<symbol>();
  #openRequest = crypto.randomUUID().replaceAll("-", "");
  #opened?: OpenedConversationBackend;
  #catalog?: CanonicalConversationCatalog;
  #opening?: Promise<CanonicalConversationCatalog>;
  #closed = false;
  #closing?: Promise<void>;
  #changing?: Promise<unknown>;
  #attemptedOpen = false;
  #releaseFailed = false;
  #acquiring = 0;
  constructor(
    private readonly port: ConversationBackendPort | undefined,
    private readonly onError: (error: unknown) => void,
    private readonly profiles: () => readonly AgentRecipientOption[] = () => [],
    private readonly openingAllowed: () => boolean = () => true,
  ) {}
  #assertOpen() {
    if (this.#closed)
      throw new Error("Native conversation workspace is closed");
    if (this.#changing || this.#releaseFailed || !this.openingAllowed())
      throw new Error(
        "Resolve the native storage change before opening conversations",
      );
  }
  open(): Promise<CanonicalConversationCatalog> {
    this.#assertOpen();
    return (this.#opening ??= this.#work.run(async () => {
      // Register the single promise before publishing or invoking native work.
      await Promise.resolve();
      this.#assertOpen();
      const port = this.port;
      if (!port) throw new Error("Native conversations are unavailable");
      const selection = await port.selection();
      this.#assertOpen();
      if (
        selection.backend !== "jj" ||
        !Number.isInteger(selection.revision) ||
        selection.revision <= 0
      )
        throw new Error(
          "Select native JJ conversation storage before opening it",
        );
      this.#attemptedOpen = true;
      const opened = await port.open(this.#openRequest);
      // Retain the exact returned handle even if Close raced this reply.
      this.#opened = structuredClone(opened);
      if (
        opened.selection.backend !== "jj" ||
        opened.selection.revision !== selection.revision
      )
        throw new Error("Native conversation storage changed while opening");
      this.#assertOpen();
      return (this.#catalog = new CanonicalConversationCatalog(port, opened));
    }));
  }
  acquireReader(): Promise<NativeConversationReaderLease> {
    this.#assertOpen();
    this.#acquiring++;
    return this.#work
      .run(async () => {
        const catalog = await this.open();
        this.#assertOpen();
        const reader = new NativeConversationReader(
          catalog,
          this.onError,
          this.profiles,
        );
        this.#readers.add(reader);
        let closed = false,
          closing: Promise<void> | undefined;
        return {
          reader,
          opened: structuredClone(this.#opened!),
          close: () => {
            if (closed) return Promise.resolve();
            return (closing ??= this.#work
              .run(() => reader.close())
              .then(() => {
                closed = true;
                this.#readers.delete(reader);
              })
              .catch((error) => {
                closing = undefined;
                throw error;
              }));
          },
        };
      })
      .finally(() => {
        this.#acquiring--;
      });
  }
  /** Keep capture authority owned even after the initiating pane closes. */
  retainTurn(opened: OpenedConversationBackend): () => void {
    this.#assertOpen();
    const owner = this.#opened;
    if (
      !owner ||
      opened.handle !== owner.handle ||
      opened.selection.backend !== "jj" ||
      opened.selection.revision !== owner.selection.revision
    )
      throw new Error("Native turn belongs to another backend owner");
    const token = Symbol();
    this.#turns.add(token);
    return () => {
      this.#turns.delete(token);
    };
  }
  prepareConversation(
    request: string,
    title: string,
  ): Promise<PreparedConversation> {
    this.#assertOpen();
    return this.#work.run(async () => {
      await this.open();
      this.#assertOpen();
      return this.port!.prepare(this.#opened!.handle, request, title);
    });
  }
  preparationStatus(request: string): Promise<PreparedConversation | null> {
    this.#assertOpen();
    return this.#work.run(async () => {
      await this.open();
      this.#assertOpen();
      return this.port!.preparationStatus(this.#opened!.handle, request);
    });
  }
  /** Fence new native use, drain existing calls, and release only an idle owner. */
  changeStorage<T>(operation: () => Promise<T>): Promise<T> {
    if (this.#closed || this.#changing)
      return Promise.reject(
        new Error("Native storage is unavailable or changing"),
      );
    if (this.#acquiring)
      return Promise.reject(
        new Error(
          "Close native conversation tabs before changing their storage",
        ),
      );
    const changing = (async () => {
      await Promise.resolve();
      await this.#work.settle();
      if (this.#readers.size || this.#turns.size)
        throw new Error(
          "Close native conversation tabs and turns before changing their storage",
        );
      if (this.#attemptedOpen && !this.#opened)
        throw new Error(
          "The original native open is unresolved; disable and re-enable AI to drain it",
        );
      this.#releaseFailed = true;
      await this.#catalog?.close();
      if (this.#opened) await this.port!.close(this.#opened.handle);
      this.#opened = undefined;
      this.#catalog = undefined;
      this.#opening = undefined;
      this.#attemptedOpen = false;
      this.#openRequest = crypto.randomUUID().replaceAll("-", "");
      this.#releaseFailed = false;
      if (this.#closed)
        throw new Error("Native conversation workspace is closed");
      return operation();
    })();
    this.#changing = changing;
    return changing.finally(() => {
      if (this.#changing === changing) this.#changing = undefined;
    });
  }
  close(): Promise<void> {
    this.#closed = true;
    return (this.#closing ??= this.#stop().catch((error) => {
      this.#closing = undefined;
      throw error;
    }));
  }
  async #stop() {
    await this.#changing?.catch(() => {});
    await this.#work.settle();
    if (this.#turns.size)
      throw new Error("Native turns must close before their backend owner");
    const results = await Promise.allSettled(
      [...this.#readers].map(async (reader) => {
        await reader.close();
        this.#readers.delete(reader);
      }),
    );
    const errors = results.flatMap((result) =>
      result.status === "rejected" ? [result.reason] : [],
    );
    if (errors.length)
      throw new AggregateError(
        errors,
        "Native conversation readers could not close",
      );
    await this.#catalog?.close();
    if (this.#opened) {
      await this.port!.close(this.#opened.handle);
      this.#opened = undefined;
    }
    // Unknown open outcomes are not retried here. The enclosing native service
    // still owns admission and must revoke/drain it during application closure.
  }
}
