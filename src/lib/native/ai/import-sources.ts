// SPDX-License-Identifier: Apache-2.0
import type {
  AiImportSources,
  ImportSourceRow,
  ImportHarness,
  FolderPage,
  SessionPage,
  PreviewPage,
} from "../../ai/imports/source-port.ts";
import {
  validateFolders,
  validateSessions,
  validatePreview,
} from "../../ai/imports/source-validation.ts";
import { validateImportRows } from "../../ai/imports/source-port.ts";
import type { CapturedSession } from "../../ai/conversations/import-types.ts";
import type { NativeCall } from "../vault-client.ts";
import { NativeTranscriptScope } from "./transcript-scope.ts";
const indexedId = (value: string) => /^[0-9a-f]{64}$/u.test(value);
const readId = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u.test(value);
/** Native handles and prepared tickets only; no paths or agent execution. */
export class NativeImportSources implements AiImportSources {
  readonly #scope: NativeTranscriptScope;
  #queue: Promise<unknown> = Promise.resolve();
  #run<T>(operation: Record<string, unknown>, signal: AbortSignal): Promise<T> {
    const task = this.#queue.then(() => this.#scope.run<T>(operation, signal));
    this.#queue = task.catch(() => {});
    return task;
  }
  async folders(
    harness: ImportHarness,
    refresh: boolean,
    signal: AbortSignal,
  ): Promise<FolderPage> {
    if (!["codex", "cursor", "opencode"].includes(harness))
      throw new Error("Invalid import harness");
    return validateFolders(
      await this.#run({ type: "folders", harness, refresh }, signal),
    );
  }
  async sessions(
    folder: string,
    after: string | undefined,
    signal: AbortSignal,
  ): Promise<SessionPage> {
    if (!indexedId(folder) || (after !== undefined && !indexedId(after)))
      throw new Error("Invalid import folder selector");
    return validateSessions(
      await this.#run(
        { type: "sessions", folder, after: after ?? null },
        signal,
      ),
      folder,
    );
  }
  async startPreview(
    selector: string,
    signal: AbortSignal,
  ): Promise<PreviewPage> {
    if (!indexedId(selector)) throw new Error("Invalid import selector");
    const reader = crypto.randomUUID();
    try {
      const page = validatePreview(
        await this.#run<PreviewPage>(
          { type: "startPreview", selector, reader },
          signal,
        ),
      );
      if (page.reader !== reader)
        throw new Error("Preview read identity changed");
      return page;
    } catch (error) {
      // The read identity is known before dispatch, including an aborted/lost start reply.
      await this.releasePreview(reader, new AbortController().signal).catch(
        () => {},
      );
      throw error;
    }
  }
  async nextPreview(reader: string, signal: AbortSignal): Promise<PreviewPage> {
    if (!readId(reader)) throw new Error("Invalid import read selector");
    return validatePreview(
      await this.#run({ type: "nextPreview", reader }, signal),
    );
  }
  releasePreview(reader: string, signal: AbortSignal): Promise<void> {
    if (!readId(reader))
      return Promise.reject(new Error("Invalid import read selector"));
    return this.#run({ type: "releasePreview", reader }, signal);
  }
  constructor(sessionId: string, call: NativeCall, allowed: () => boolean) {
    this.#scope = new NativeTranscriptScope(sessionId, call, allowed);
  }
  async list(signal: AbortSignal): Promise<ImportSourceRow[]> {
    return validateImportRows(
      await this.#run<ImportSourceRow[]>({ type: "list" }, signal),
    );
  }
  preview(selector: string, signal: AbortSignal): Promise<CapturedSession> {
    if (!/^[A-Za-z0-9._:-]{1,128}$/u.test(selector))
      return Promise.reject(new Error("Invalid import selector"));
    return this.#run({ type: "preview", selector }, signal);
  }
  async close(): Promise<void> {
    const closing = this.#scope.close();
    await Promise.allSettled([closing, this.#queue]);
    await closing;
  }
}
