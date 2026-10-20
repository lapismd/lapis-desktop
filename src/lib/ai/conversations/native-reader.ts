import type { TranscriptItem } from "@lapismd/design-core/chat";
import { OwnedAiWork } from "../core/owned-work.ts";
import { projectNativeSession } from "../chat/native-session-projection.ts";
import { projectNativeThread } from "../chat/native-thread-projection.ts";
import { projectNativeHistory } from "../chat/native-history-projection.ts";
import type { CanonicalConversationRead } from "./backend-port.ts";
import type { CanonicalConversationIdentity } from "./backend-port.ts";
import {
  CanonicalConversationCatalog,
  type CanonicalCatalogState,
  type CanonicalReadLease,
} from "./canonical-catalog.ts";
import { NativeSessionRecords } from "./native-session-records.ts";
import type { AgentRecipientOption } from "./recipients.ts";

export type NativeConversationReaderState = {
  catalog: CanonicalCatalogState;
  reading: boolean;
  conversation?: CanonicalConversationRead;
  source: string;
  items: TranscriptItem[];
  error?: string;
};

/** UI read owner; its caller owns the already-admitted catalog/backend lifetime. */
export class NativeConversationReader {
  readonly #work = new OwnedAiWork();
  readonly #listeners = new Set<
    (state: NativeConversationReaderState) => void
  >();
  readonly #leases = new Set<CanonicalReadLease>();
  readonly #readers = new Map<string, Map<string, NativeSessionRecords>>();
  readonly #unsubscribe: () => void;
  #state: NativeConversationReaderState;
  #lease?: CanonicalReadLease;
  #generation = 0;
  #closed = false;
  #closing?: Promise<void>;
  constructor(
    readonly catalog: CanonicalConversationCatalog,
    private readonly onError: (error: unknown) => void,
    private readonly profiles: () => readonly AgentRecipientOption[] = () => [],
  ) {
    this.#state = {
      catalog: catalog.state,
      reading: false,
      source: "thread",
      items: [],
    };
    this.#unsubscribe = catalog.subscribe((catalog) => {
      if (!this.#closed) this.#publish({ ...this.#state, catalog });
    });
  }
  get state(): NativeConversationReaderState {
    return structuredClone(this.#state);
  }
  subscribe(
    listener: (state: NativeConversationReaderState) => void,
  ): () => void {
    this.#assertOpen();
    this.#listeners.add(listener);
    listener(this.state);
    return () => {
      this.#listeners.delete(listener);
    };
  }
  #assertOpen() {
    if (this.#closed) throw new Error("Native conversation reader is closed");
  }
  #current(generation: number) {
    return !this.#closed && generation === this.#generation;
  }
  #publish(state: NativeConversationReaderState) {
    this.#state = state;
    for (const listener of this.#listeners) listener(this.state);
  }
  refresh(): Promise<void> {
    this.#assertOpen();
    return this.#work.run(async () => {
      try {
        await this.catalog.refresh();
      } catch (error) {
        if (!this.#closed) this.onError(error);
        throw error;
      }
    });
  }
  more(): Promise<void> {
    this.#assertOpen();
    return this.#work.run(async () => {
      try {
        await this.catalog.loadMore();
      } catch (error) {
        if (!this.#closed) this.onError(error);
        throw error;
      }
    });
  }
  select(threadId: string): Promise<void> {
    return this.#select(threadId);
  }
  selectRoute(
    identity: CanonicalConversationIdentity,
    history = false,
  ): Promise<void> {
    return this.#select(identity.threadId, identity, history);
  }
  /** Keep the current pin/live view until the replacement covers every worker. */
  reconcile(
    identity: CanonicalConversationIdentity,
    requests: readonly string[],
    accept: () => void,
  ): Promise<void> {
    return this.#select(
      identity.threadId,
      identity,
      true,
      (lease) => {
        const captured = this.#capturedRequests(lease);
        if (requests.some((request) => !captured.has(request)))
          throw new Error(
            "Captured history has not confirmed every started native session; the live view is retained",
          );
        accept();
      },
      false,
    );
  }
  #select(
    threadId: string,
    route?: CanonicalConversationIdentity,
    history = this.#state.source === "history",
    beforeCommit?: (lease: CanonicalReadLease) => void,
    reportFailure = true,
  ): Promise<void> {
    this.#assertOpen();
    const generation = ++this.#generation;
    this.#publish({ ...this.#state, reading: true, error: undefined });
    return this.#work.run(async () => {
      let lease: CanonicalReadLease | undefined;
      try {
        lease =
          (await (route
            ? this.catalog.openRouteRead(route)
            : this.catalog.openRead(threadId))) ?? undefined;
        if (!lease)
          throw new Error(
            "Conversation is no longer available. Refresh its catalog.",
          );
        this.#leases.add(lease);
        if (!this.#current(generation)) {
          await this.#release(lease);
          return;
        }
        const source = history
          ? "history"
          : lease.read.view.messages.some((v) => v.body !== null)
            ? "thread"
            : (lease.read.recordSources[0]?.cursor ?? "thread");
        const items = await this.#items(lease, source);
        if (!this.#current(generation)) {
          await this.#release(lease);
          return;
        }
        const previous = this.#lease;
        beforeCommit?.(lease);
        this.#lease = lease;
        this.#publish({
          ...this.#state,
          reading: false,
          conversation: lease.read,
          source,
          items,
          error: undefined,
        });
        if (previous) await this.#release(previous);
      } catch (error) {
        if (lease && lease !== this.#lease) {
          try {
            await this.#release(lease);
          } catch {
            /* Retain exact lease for close retry. */
          }
        }
        if (this.#current(generation)) this.#failure(error, reportFailure);
        throw error;
      }
    });
  }
  selectSource(source: string): Promise<void> {
    this.#assertOpen();
    const lease = this.#lease;
    if (!lease)
      return Promise.reject(new Error("Choose a native conversation first"));
    const generation = ++this.#generation;
    this.#publish({ ...this.#state, reading: true, error: undefined });
    return this.#work.run(async () => {
      try {
        const items = await this.#items(lease, source);
        if (this.#current(generation))
          this.#publish({
            ...this.#state,
            reading: false,
            source,
            items,
            error: undefined,
          });
      } catch (error) {
        if (this.#current(generation)) this.#failure(error);
        throw error;
      }
    });
  }
  #failure(error: unknown, notify = true) {
    this.#publish({
      ...this.#state,
      reading: false,
      error: error instanceof Error ? error.message : String(error),
    });
    if (notify) this.onError(error);
  }
  async #items(
    lease: CanonicalReadLease,
    source: string,
  ): Promise<TranscriptItem[]> {
    if (source === "history") {
      const groups: TranscriptItem[][] = [];
      for (const origin of lease.read.recordSources)
        groups.push(await this.#items(lease, origin.cursor));
      return projectNativeHistory(lease.read.view, groups);
    }
    if (source === "thread") return projectNativeThread(lease.read.view);
    let readers = this.#readers.get(lease.read.handle);
    if (!readers) this.#readers.set(lease.read.handle, (readers = new Map()));
    let reader = readers.get(source);
    if (!reader)
      readers.set(source, (reader = new NativeSessionRecords(lease, source)));
    await reader.loadAll();
    return projectNativeSession(reader, {
      conversation: lease.read.view,
      profiles: this.profiles(),
    });
  }
  async #release(lease: CanonicalReadLease) {
    await lease.close();
    this.#leases.delete(lease);
    this.#readers.delete(lease.read.handle);
  }
  capturedRequests(): Set<string> {
    return this.#capturedRequests(this.#lease);
  }
  #capturedRequests(lease?: CanonicalReadLease): Set<string> {
    const requests = new Set<string>();
    if (!lease) return requests;
    for (const records of this.#readers.get(lease.read.handle)?.values() ??
      []) {
      if (!records.state.complete) continue;
      const evidence = [...records.source.evidence];
      for (const ref of records.source.eventBatches) {
        const record = records.record(ref);
        if (record?.projection.type === "event_batch")
          evidence.push(record.projection.value.evidence);
      }
      for (const ref of evidence) {
        const record = records.record(ref);
        const fact =
          record?.projection.type === "observation_batch"
            ? record.projection.value.desktop
            : undefined;
        if (
          fact?.requestId &&
          fact.repository === lease.read.identity.repository &&
          fact.threadId === lease.read.identity.threadId
        )
          requests.add(fact.requestId);
      }
    }
    return requests;
  }
  close(): Promise<void> {
    this.#closed = true;
    this.#generation++;
    this.#unsubscribe();
    this.#listeners.clear();
    return (this.#closing ??= this.#close().catch((error) => {
      this.#closing = undefined;
      throw error;
    }));
  }
  async #close() {
    await this.#work.settle();
    const results = await Promise.allSettled(
      [...this.#leases].map((lease) => this.#release(lease)),
    );
    const failures = results.flatMap((v) =>
      v.status === "rejected" ? [v.reason] : [],
    );
    if (failures.length)
      throw new AggregateError(
        failures,
        "Native conversation read cleanup failed",
      );
  }
}
