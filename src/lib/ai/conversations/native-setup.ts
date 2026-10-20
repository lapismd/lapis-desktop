// SPDX-License-Identifier: Apache-2.0
import { OwnedAiWork } from "../core/owned-work.ts";
import type {
  BackendSelection,
  BackendSelectionReceipt,
  ConversationBackend,
  ConversationBackendPort,
  PreparedConversation,
} from "./backend-port.ts";
import {
  nativeConversationReference,
  type NativeConversationReference,
} from "./conversation-route.ts";
import type { NativeConversationWorkspace } from "./native-workspace.ts";

type Choice = {
  request: string;
  expectedRevision: number;
  backend: ConversationBackend;
};
type Creation = {
  request: string;
  title: string;
  result?: PreparedConversation;
  reference?: NativeConversationReference;
};
export type NativeConversationSetupState = {
  busy: boolean;
  selection?: BackendSelection;
  pendingChoice?: Choice;
  creation?: Creation;
  error?: string;
  closed: boolean;
};
const requestId = () => crypto.randomUUID().replaceAll("-", "");

/** Native receipts own outcomes. This owner retains intent, never transcript content. */
export class NativeConversationSetup {
  readonly #work = new OwnedAiWork();
  readonly #listeners = new Set<
    (state: NativeConversationSetupState) => void
  >();
  #state: NativeConversationSetupState = { busy: false, closed: false };
  constructor(
    private readonly port: ConversationBackendPort | undefined,
    private readonly workspace: NativeConversationWorkspace,
    readonly report: (error: unknown) => void,
  ) {}
  get available() {
    return Boolean(this.port) && !this.#state.closed;
  }
  get openingAllowed() {
    return !this.#state.closed && !this.#state.pendingChoice;
  }
  #assertAlive() {
    if (this.#state.closed)
      throw new Error("Native conversation settings are closed");
  }
  get state() {
    return structuredClone(this.#state);
  }
  subscribe(listener: (state: NativeConversationSetupState) => void) {
    this.#listeners.add(listener);
    listener(this.state);
    return () => {
      this.#listeners.delete(listener);
    };
  }
  #publish(patch: Partial<NativeConversationSetupState>) {
    this.#state = { ...this.#state, ...patch };
    for (const listener of this.#listeners) listener(this.state);
  }
  #run<T>(
    operation: (port: ConversationBackendPort) => Promise<T>,
  ): Promise<T> {
    if (!this.available || this.#state.busy)
      return Promise.reject(
        new Error("Native conversation settings are unavailable or busy"),
      );
    this.#publish({ busy: true, error: undefined });
    return this.#work.run(async () => {
      try {
        await Promise.resolve();
        this.#assertAlive();
        return await operation(this.port!);
      } catch (error) {
        if (!this.#state.closed) {
          this.#publish({
            error: error instanceof Error ? error.message : String(error),
          });
          this.report(error);
        }
        throw error;
      } finally {
        this.#publish({ busy: false });
      }
    });
  }
  refresh(): Promise<void> {
    return this.#run(async (port) => {
      const pending = this.#state.pendingChoice;
      if (pending) {
        const receipt = await port.selectionStatus(pending.request);
        if (receipt) this.#acceptChoice(receipt, pending);
      }
      this.#assertAlive();
      this.#publish({ selection: await port.selection() });
    });
  }
  choose(backend: ConversationBackend): Promise<void> {
    return this.#run(async (port) => {
      if (backend !== "jj" && backend !== "vault-files")
        throw new Error("Invalid conversation storage");
      if (
        this.#state.pendingChoice ||
        (this.#state.creation && !this.#state.creation.reference)
      )
        throw new Error(
          "Check the original native request before changing storage",
        );
      const selection = await port.selection();
      this.#assertAlive();
      this.#publish({ selection });
      if (selection.backend === backend) return;
      const pending = {
        request: requestId(),
        expectedRevision: selection.revision,
        backend,
      };
      const receipt = await this.workspace.changeStorage(async () => {
        this.#assertAlive();
        this.#publish({ pendingChoice: pending });
        return port.select(pending.request, pending.expectedRevision, backend);
      });
      if (!receipt)
        throw new Error(
          "Storage choice is unconfirmed. Check its original request.",
        );
      this.#acceptChoice(receipt, pending);
    });
  }
  #acceptChoice(receipt: BackendSelectionReceipt, pending: Choice) {
    if (
      receipt.request_id !== pending.request ||
      receipt.expected_revision !== pending.expectedRevision ||
      receipt.selection.backend !== pending.backend ||
      receipt.selection.revision !== pending.expectedRevision + 1
    )
      throw new Error("Storage receipt does not match the original choice");
    this.#publish({ pendingChoice: undefined, selection: receipt.selection });
  }
  create(title: string): Promise<NativeConversationReference | undefined> {
    return this.#run(async (port) => {
      if (
        this.#state.pendingChoice ||
        (this.#state.creation && !this.#state.creation.reference)
      )
        throw new Error(
          "Check the original native request before creating another conversation",
        );
      if (
        !title.trim() ||
        new TextEncoder().encode(title).length > 1024 ||
        /[\u0000-\u001f\u007f-\u009f]/u.test(title)
      )
        throw new Error(
          "Use a single-line conversation title of at most 1024 bytes",
        );
      const selection = await port.selection();
      this.#assertAlive();
      this.#publish({ selection });
      if (selection.backend !== "jj")
        throw new Error(
          "Enable native JJ history before creating a native conversation",
        );
      // Resolve backend admission before retaining a new creation intent.
      await this.workspace.open();
      this.#assertAlive();
      const creation = { request: requestId(), title };
      this.#publish({ creation });
      return this.#acceptCreation(
        await this.workspace.prepareConversation(creation.request, title),
        creation,
      );
    });
  }
  recoverCreation(): Promise<NativeConversationReference | undefined> {
    return this.#run(async () => {
      const creation = this.#state.creation;
      if (!creation)
        throw new Error("There is no native creation request to check");
      if (creation.reference) return structuredClone(creation.reference);
      const result = await this.workspace.preparationStatus(creation.request);
      return result ? this.#acceptCreation(result, creation) : undefined;
    });
  }
  #acceptCreation(result: PreparedConversation, creation: Creation) {
    const previous = creation.result;
    if (
      result.requestId !== creation.request ||
      (previous &&
        (result.conversationId !== previous.conversationId ||
          result.threadId !== previous.threadId ||
          (previous.repository !== null &&
            result.repository !== previous.repository)))
    )
      throw new Error("Conversation receipt changed its original identity");
    if (result.receipt !== null && !result.receipt.trim())
      throw new Error("Conversation receipt is empty");
    const reference =
      result.receipt === null
        ? undefined
        : nativeConversationReference({
            target: { type: "conversation", id: result.conversationId },
            threadId: result.threadId,
            repository: result.repository,
          });
    this.#publish({
      creation: { ...creation, result: structuredClone(result), reference },
    });
    return reference ? structuredClone(reference) : undefined;
  }
  async close(): Promise<void> {
    this.#publish({ closed: true });
    this.#listeners.clear();
    await this.#work.settle();
  }
}
