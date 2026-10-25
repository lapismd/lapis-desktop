import {
  REMOTE_APP_DATABASE_MAX_MESSAGE_BYTES,
  parseRemoteAppDatabaseArgs,
  parseRemoteAppDatabaseResult,
  type AppDatabaseChangeListener,
  type ChangeSet,
  type DatabaseCall,
  type DatabaseValue,
  type RemoteAppDatabaseMethod,
} from "@lapis-notes/api/app-database";
import { Channel, invoke } from "@tauri-apps/api/core";
import { nativeError } from "../native-error.ts";
import type { NativeCall, VaultDescriptor } from "../vault-client.ts";

export type DatabaseChannelFactory = (
  listener: (change: ChangeSet) => void,
) => unknown;
export const nativeDatabaseChannel: DatabaseChannelFactory = (listener) =>
  new Channel<ChangeSet>(listener);

/** Ordered transport for a passive view of the native vault-owned database. */
export class NativeDatabaseTransport {
  #call: NativeCall;
  #sessionId: string;
  #connectionId = "";
  #queue: Promise<void> = Promise.resolve();
  #closing = false;
  #closed = false;
  #closePromise?: Promise<void>;
  #listeners = new Set<AppDatabaseChangeListener>();

  private constructor(call: NativeCall, session: string) {
    this.#call = call;
    this.#sessionId = session;
  }

  static async open(
    selected: VaultDescriptor,
    call: NativeCall = invoke,
    channel: DatabaseChannelFactory = nativeDatabaseChannel,
  ): Promise<NativeDatabaseTransport> {
    const transport = new NativeDatabaseTransport(call, selected.sessionId);
    try {
      const admission = await call<{ connectionId: string }>("vault_db_open", {
        sessionId: selected.sessionId,
        onChange: channel((change) => transport.#change(change)),
      });
      if (
        typeof admission?.connectionId !== "string" ||
        !admission.connectionId
      )
        throw new Error("The native database did not return an admission");
      transport.#connectionId = admission.connectionId;
      return transport;
    } catch (error) {
      throw nativeError(error);
    }
  }

  requireOpen(): void {
    if (this.#closing) throw new Error("Database is closing or closed");
  }

  subscribe(listener: AppDatabaseChangeListener): () => void {
    this.requireOpen();
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #change(change: ChangeSet): void {
    if (this.#closed) return;
    for (const listener of [...this.#listeners]) {
      try {
        listener(change);
      } catch (error) {
        console.error("Native database change listener failed", error);
      }
    }
  }

  call(method: RemoteAppDatabaseMethod, args: unknown[]): Promise<unknown> {
    let request: DatabaseCall;
    try {
      this.requireOpen();
      const frame: DatabaseCall = {
        method,
        args: parseRemoteAppDatabaseArgs(method, args).map((value) =>
          value === undefined
            ? { kind: "undefined" }
            : { kind: "value", value },
        ),
      };
      // Snapshot accepted arguments before another queued call can mutate them.
      const encoded = JSON.stringify(frame);
      if (
        new TextEncoder().encode(encoded).byteLength >
        REMOTE_APP_DATABASE_MAX_MESSAGE_BYTES
      )
        throw new Error("Native database request exceeds the message limit");
      request = JSON.parse(encoded) as DatabaseCall;
    } catch (error) {
      return Promise.reject(nativeError(error));
    }
    const result = this.#queue
      .then(async () => {
        const reply = await this.#call<DatabaseValue>("vault_db_call", {
          sessionId: this.#sessionId,
          connectionId: this.#connectionId,
          request,
        });
        if (!reply || typeof reply !== "object")
          throw new Error("Invalid native database response");
        if (reply.kind === "undefined")
          return parseRemoteAppDatabaseResult(method, undefined);
        if (reply.kind === "value" && Object.hasOwn(reply, "value"))
          return parseRemoteAppDatabaseResult(method, reply.value);
        throw new Error("Invalid native database response");
      })
      .catch((error) => {
        throw nativeError(error);
      });
    this.#queue = result.then(
      () => {},
      () => {},
    );
    return result;
  }

  close(): Promise<void> {
    if (this.#closePromise) return this.#closePromise;
    this.#closing = true;
    this.#closePromise = this.#queue
      .then(() =>
        this.#call<void>("vault_db_close", {
          sessionId: this.#sessionId,
          connectionId: this.#connectionId,
        }),
      )
      .then(() => {
        this.#closed = true;
        this.#listeners.clear();
      })
      .catch((error) => {
        this.#closing = false;
        this.#closePromise = undefined;
        throw nativeError(error);
      });
    return this.#closePromise;
  }
}
