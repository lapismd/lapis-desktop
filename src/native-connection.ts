import type {
  TursoConnection,
  TursoStatementInput,
} from "@lapis-notes/api/app-database";
import { invoke } from "@tauri-apps/api/core";
import { nativeError } from "./native-error.ts";
import type { NativeCall, VaultDescriptor } from "./vault-client.ts";
import {
  callArgs,
  decodeRows,
  encodeArgs,
  type SqlValue,
} from "./database-codec.ts";

type Reply =
  | { kind: "empty" }
  | { kind: "run"; result: unknown }
  | { kind: "rows"; rows: Record<string, SqlValue>[] }
  | { kind: "batch"; results: unknown[] };

export class NativeTursoConnection implements TursoConnection {
  #call: NativeCall;
  #sessionId: string;
  #connectionId: string;
  #queue: Promise<void> = Promise.resolve();
  #closing = false;
  #closePromise?: Promise<void>;

  private constructor(
    call: NativeCall,
    sessionId: string,
    connectionId: string,
  ) {
    this.#call = call;
    this.#sessionId = sessionId;
    this.#connectionId = connectionId;
  }

  static async open(
    selected: VaultDescriptor,
    call: NativeCall = invoke,
  ): Promise<NativeTursoConnection> {
    try {
      const admission = await call<{ connectionId: string }>("vault_db_open", {
        sessionId: selected.sessionId,
      });
      if (!admission?.connectionId)
        throw new Error("The native database did not return an admission");
      return new NativeTursoConnection(
        call,
        selected.sessionId,
        admission.connectionId,
      );
    } catch (error) {
      throw nativeError(error);
    }
  }

  #send(request: Record<string, unknown>): Promise<Reply> {
    if (this.#closing)
      return Promise.reject(new Error("Database is closing or closed"));
    const result = this.#queue
      .then(() =>
        this.#call<Reply>("vault_db_execute", {
          sessionId: this.#sessionId,
          connectionId: this.#connectionId,
          request,
        }),
      )
      .catch((error) => {
        throw nativeError(error);
      });
    this.#queue = result.then(
      () => {},
      () => {},
    );
    return result;
  }

  async exec(sql: string): Promise<void> {
    const reply = await this.#send({ operation: "exec", sql });
    if (reply.kind !== "empty") throw new Error("Invalid native exec response");
  }

  async run(sql: string, ...args: unknown[]): Promise<unknown> {
    const reply = await this.#send({
      operation: "run",
      statement: { sql, args: callArgs(args) },
    });
    if (reply.kind !== "run") throw new Error("Invalid native run response");
    return reply.result;
  }

  async get<T extends Record<string, unknown>>(
    sql: string,
    ...args: unknown[]
  ): Promise<T | undefined> {
    const reply = await this.#send({
      operation: "get",
      statement: { sql, args: callArgs(args) },
    });
    if (reply.kind !== "rows") throw new Error("Invalid native get response");
    return decodeRows(reply.rows)[0] as T | undefined;
  }

  async all<T extends Record<string, unknown>>(
    sql: string,
    ...args: unknown[]
  ): Promise<T[]> {
    const reply = await this.#send({
      operation: "all",
      statement: { sql, args: callArgs(args) },
    });
    if (reply.kind !== "rows") throw new Error("Invalid native all response");
    return decodeRows(reply.rows) as T[];
  }

  async batch(
    statements: Array<string | TursoStatementInput>,
    options?: string,
  ): Promise<unknown> {
    const reply = await this.#send({
      operation: "batch",
      behavior: options ?? "immediate",
      statements: statements.map((entry) =>
        typeof entry === "string"
          ? { sql: entry, args: [] }
          : { sql: entry.sql, args: encodeArgs(entry.args ?? []) },
      ),
    });
    if (reply.kind !== "batch")
      throw new Error("Invalid native batch response");
    return reply.results;
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
      .catch((error) => {
        this.#closing = false;
        this.#closePromise = undefined;
        throw nativeError(error);
      });
    return this.#closePromise;
  }
}
