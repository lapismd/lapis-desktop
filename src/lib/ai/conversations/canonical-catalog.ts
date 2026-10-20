import { OwnedAiWork } from "../core/owned-work.ts";
import type { NativeRecordPage } from "./native-records.ts";
import { nativeConversationReference } from "./conversation-route.ts";
import {
  extendCanonicalCatalog,
  sameCanonicalConversation,
  type CatalogPageState,
} from "./catalog-pages.ts";
import type {
  CanonicalConversationRead,
  CanonicalConversationIdentity,
  CanonicalConversationPort,
  ConversationBackendPort,
  OpenedConversationBackend,
} from "./backend-port.ts";

export type CanonicalCatalogState = {
  phase: "idle" | "loading" | "ready" | "error" | "closed";
  busy: boolean;
  page?: CatalogPageState;
  error?: string;
};
export type CanonicalReadLease = {
  readonly read: CanonicalConversationRead;
  range(cursor: string, afterSequence: string): Promise<string>;
  records(cursor: string, afterIndex: number): Promise<NativeRecordPage>;
  close(): Promise<void>;
};
type ReaderPort = Pick<
  ConversationBackendPort,
  "readTranscript" | "readRecords" | "closeRead"
> & {
  canonical: Pick<CanonicalConversationPort, "list" | "openRead">;
};

/** One already-admitted JJ backend; view closure cannot revoke another worker. */
export class CanonicalConversationCatalog {
  readonly #work = new OwnedAiWork();
  readonly #listeners = new Set<(state: CanonicalCatalogState) => void>();
  readonly #reads = new Map<string, CanonicalConversationRead>();
  readonly #cursors = new Set<string>();
  #state: CanonicalCatalogState = { phase: "idle", busy: false };
  #generation = 0;
  #closed = false;
  #closing?: Promise<void>;
  #more?: Promise<void>;
  private readonly opened: OpenedConversationBackend;
  constructor(
    private readonly port: ReaderPort,
    opened: OpenedConversationBackend,
  ) {
    if (opened.selection.backend !== "jj")
      throw new Error(
        "Native conversations require an explicitly selected JJ backend",
      );
    this.opened = structuredClone(opened);
  }
  get state(): CanonicalCatalogState {
    return structuredClone(this.#state);
  }
  subscribe(listener: (state: CanonicalCatalogState) => void): () => void {
    this.#assertOpen();
    this.#listeners.add(listener);
    listener(this.state);
    return () => {
      this.#listeners.delete(listener);
    };
  }
  #publish(state: CanonicalCatalogState) {
    this.#state = state;
    for (const listener of this.#listeners) listener(this.state);
  }
  #assertOpen() {
    if (this.#closed) throw new Error("Conversation catalog is closed");
  }
  #current(generation: number) {
    return !this.#closed && generation === this.#generation;
  }
  #failure(error: unknown) {
    this.#publish({
      ...this.#state,
      phase: "error",
      busy: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
  refresh(): Promise<void> {
    this.#assertOpen();
    const generation = ++this.#generation;
    this.#publish({
      ...this.#state,
      phase: "loading",
      busy: true,
      error: undefined,
    });
    return this.#work.run(async () => {
      try {
        const page = await this.port.canonical.list(this.opened.handle);
        if (!this.#current(generation)) return;
        this.#cursors.clear();
        this.#publish({ phase: "ready", busy: false, page });
      } catch (error) {
        if (!this.#current(generation)) return;
        this.#failure(error);
        throw error;
      }
    });
  }
  loadMore(): Promise<void> {
    this.#assertOpen();
    if (this.#more) return this.#more;
    const previous = this.#state.page,
      cursor = previous?.nextCursor;
    if (!previous || cursor == null || this.#state.busy)
      return Promise.resolve();
    const generation = this.#generation;
    this.#publish({ ...this.#state, busy: true, error: undefined });
    const job = this.#work.run(async () => {
      try {
        const page = await this.port.canonical.list(this.opened.handle, cursor);
        if (!this.#current(generation)) return;
        if (
          page.nextCursor === cursor ||
          (page.nextCursor !== null && this.#cursors.has(page.nextCursor))
        )
          throw new Error(
            "Conversation catalog repeated a continuation cursor",
          );
        const next = extendCanonicalCatalog(previous, page);
        this.#cursors.add(cursor);
        this.#publish({ phase: "ready", busy: false, page: next });
      } catch (error) {
        if (!this.#current(generation)) return;
        this.#failure(error);
        throw error;
      }
    });
    this.#more = job;
    void job.then(
      () => {
        this.#more = undefined;
      },
      () => {
        this.#more = undefined;
      },
    );
    return job;
  }
  openRead(threadId: string): Promise<CanonicalReadLease | null> {
    this.#assertOpen();
    const member = this.#state.page?.conversations.find(
      (row) => row.threadId === threadId,
    );
    if (!member)
      return Promise.reject(
        new Error("Choose a conversation from the current catalog"),
      );
    return this.#openRead(member);
  }
  /** A restored route is a reference, not authority; native membership and the
   * exact returned pin must independently match it. No catalog scan is needed. */
  openRouteRead(
    identity: CanonicalConversationIdentity,
  ): Promise<CanonicalReadLease | null> {
    this.#assertOpen();
    return this.#openRead(nativeConversationReference(identity));
  }
  #openRead(
    member: CanonicalConversationIdentity,
  ): Promise<CanonicalReadLease | null> {
    return this.#work.run(async () => {
      const read = await this.port.canonical.openRead(
        this.opened.handle,
        member.threadId,
      );
      if (!read) return null;
      this.#reads.set(read.handle, read);
      if (this.#closed) throw new Error("Conversation catalog is closed");
      if (!sameCanonicalConversation(member, read.identity)) {
        await this.#release(read.handle);
        throw new Error(
          "Conversation identity changed. Refresh before opening it.",
        );
      }
      const ranges = new OwnedAiWork();
      let closed = false,
        closingRequested = false,
        closing: Promise<void> | undefined;
      return {
        read: structuredClone(read),
        range: (cursor, afterSequence) => {
          this.#assertOpen();
          if (closed || closingRequested)
            return Promise.reject(new Error("Conversation read is closed"));
          return this.#work.run(() =>
            ranges.run(() =>
              this.port.readTranscript(
                this.opened.handle,
                read.handle,
                cursor,
                afterSequence,
              ),
            ),
          );
        },
        records: (cursor, afterIndex) => {
          this.#assertOpen();
          if (closed || closingRequested)
            return Promise.reject(new Error("Conversation read is closed"));
          return this.#work.run(() =>
            ranges.run(() =>
              this.port
                .readRecords(
                  this.opened.handle,
                  read.handle,
                  cursor,
                  afterIndex,
                )
                .then((page) => {
                  if (
                    page.origin.version !== 2 ||
                    !sameCanonicalConversation(
                      page.origin.conversation,
                      read.identity,
                    ) ||
                    JSON.stringify(page.selection) !==
                      JSON.stringify(read.selection)
                  )
                    throw new Error(
                      "Conversation records changed their retained identity",
                    );
                  return page;
                }),
            ),
          );
        },
        close: () => {
          if (closed) return Promise.resolve();
          closingRequested = true;
          if (this.#closed) return this.close();
          return (closing ??= this.#work
            .run(async () => {
              await ranges.settle();
              await this.#release(read.handle);
            })
            .then(
              () => {
                closed = true;
              },
              (error: unknown) => {
                closing = undefined;
                throw error;
              },
            ));
        },
      };
    });
  }
  async #release(handle: string): Promise<void> {
    if (!this.#reads.has(handle)) return;
    await this.port.closeRead(this.opened.handle, handle);
    this.#reads.delete(handle);
  }
  close(): Promise<void> {
    this.#closed = true;
    this.#generation++;
    this.#state = { ...this.#state, phase: "closed", busy: false };
    this.#listeners.clear();
    return (this.#closing ??= this.#close().catch((error) => {
      this.#closing = undefined;
      throw error;
    }));
  }
  async #close() {
    await this.#work.settle();
    const results = await Promise.allSettled(
      [...this.#reads.keys()].map((handle) => this.#release(handle)),
    );
    const failures = results.flatMap((result) =>
      result.status === "rejected" ? [result.reason] : [],
    );
    if (failures.length)
      throw new AggregateError(failures, "Conversation read cleanup failed");
  }
}
