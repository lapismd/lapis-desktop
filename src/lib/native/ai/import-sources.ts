// SPDX-License-Identifier: Apache-2.0
import type {
  AiImportSources,
  ImportSourceRow,
} from "../../ai/imports/source-port.ts";
import { validateImportRows } from "../../ai/imports/source-port.ts";
import type { CapturedSession } from "../../ai/conversations/import-types.ts";
import type { NativeCall } from "../vault-client.ts";
import { NativeTranscriptScope } from "./transcript-scope.ts";
/** Native handles and prepared tickets only; no paths or agent execution. */
export class NativeImportSources implements AiImportSources {
  readonly #scope: NativeTranscriptScope;
  constructor(sessionId: string, call: NativeCall, allowed: () => boolean) {
    this.#scope = new NativeTranscriptScope(sessionId, call, allowed);
  }
  async list(signal: AbortSignal): Promise<ImportSourceRow[]> {
    return validateImportRows(
      await this.#scope.run<ImportSourceRow[]>({ type: "list" }, signal),
    );
  }
  preview(selector: string, signal: AbortSignal): Promise<CapturedSession> {
    if (!/^[A-Za-z0-9._:-]{1,128}$/u.test(selector))
      return Promise.reject(new Error("Invalid import selector"));
    return this.#scope.run({ type: "preview", selector }, signal);
  }
  close(): Promise<void> {
    return this.#scope.close();
  }
}
