import type {
  ConversationBackend,
  ConversationBackendPort,
  ConversationRead,
} from "../../../ai/conversations/backend-port.ts";
import * as wire from "./wire.ts";
import { NativeCanonicalConversations } from "./canonical.ts";
import { NativeAuthoredConversations } from "./authored.ts";
import { NativeManagedConversations } from "./managed.ts";
import { NativeConversationDispatch } from "./dispatch.ts";
import { recordPage } from "./record-pages.ts";
import type { NativeRecordPage } from "../../../ai/conversations/native-records.ts";

/** A single transport call per intent. Native code owns receipts and store lifetime. */
export class NativeConversationBackend implements ConversationBackendPort {
  readonly dispatch = new NativeConversationDispatch((kind, operation) =>
    this.call(kind, operation),
  );
  readonly managed = new NativeManagedConversations((kind, operation) =>
    this.call(kind, operation),
  );
  readonly canonical = new NativeCanonicalConversations((kind, operation) =>
    this.call(kind, operation),
  );
  readonly authored = new NativeAuthoredConversations((kind, operation) =>
    this.call(kind, operation),
  );
  constructor(
    private readonly session: string,
    private readonly invoke: (
      request: string,
      cleanup?: boolean,
    ) => Promise<string>,
  ) {}
  private async call(
    kind: string,
    operation: Record<string, unknown>,
  ): Promise<unknown> {
    const request = wire.request(this.session, operation);
    const cleanup = [
      "close",
      "closeConversationRead",
      "fenceCanonicalDispatch",
      "stopCanonicalDispatch",
    ].includes(String(operation.type));
    return wire.response(
      await (cleanup ? this.invoke(request, true) : this.invoke(request)),
      kind,
    );
  }
  async selection() {
    return wire.selection(await this.call("selection", { type: "read" }));
  }
  async select(
    request: string,
    expectedRevision: number,
    backend: ConversationBackend,
  ) {
    wire.id(request);
    wire.revision(expectedRevision);
    if (backend !== "jj" && backend !== "vault-files") return wire.invalid();
    const receipt = wire.receipt(
      await this.call("receipt", {
        type: "select",
        requestId: request,
        expectedRevision,
        backend,
      }),
      request,
    );
    if (
      receipt &&
      (receipt.expected_revision !== expectedRevision ||
        receipt.selection.backend !== backend)
    )
      return wire.invalid();
    return receipt;
  }
  async selectionStatus(request: string) {
    return wire.receipt(
      await this.call("receipt", {
        type: "status",
        requestId: wire.id(request),
      }),
      request,
    );
  }
  async open(request: string) {
    const opened = wire.record(
      await this.call("opened", { type: "open", requestId: wire.id(request) }),
    );
    return {
      handle: wire.handle(opened.handle),
      selection: wire.selection(opened.selection),
    };
  }
  async prepare(handle: string, request: string, title: string) {
    wire.text(title, 1024);
    if (!title.trim() || /[\u0000-\u001f\u007f-\u009f]/u.test(title))
      return wire.invalid();
    const result = wire.prepared(
      await this.call("conversation", {
        type: "prepareConversation",
        handle: wire.handle(handle),
        requestId: wire.id(request),
        title,
      }),
      request,
    );
    return result ?? wire.invalid();
  }
  async preparationStatus(handle: string, request: string) {
    return wire.prepared(
      await this.call("conversation", {
        type: "conversationStatus",
        handle: wire.handle(handle),
        requestId: wire.id(request),
      }),
      request,
    );
  }
  async openRead(
    handle: string,
    request: string,
  ): Promise<ConversationRead | null> {
    const result = await this.call("conversationRead", {
      type: "openConversationRead",
      handle: wire.handle(handle),
      requestId: wire.id(request),
    });
    if (result === null) return null;
    const read = wire.record(result);
    return {
      handle: wire.handle(read.handle),
      snapshot: wire.text(read.snapshot),
    };
  }
  async readTranscript(
    handle: string,
    readHandle: string,
    cursor: string,
    afterSequence: string,
  ) {
    if (
      typeof afterSequence !== "string" ||
      !/^(0|[1-9][0-9]{0,19})$/u.test(afterSequence) ||
      BigInt(afterSequence) > 0xffffffffffffffffn
    )
      return wire.invalid();
    return wire.text(
      await this.call("transcriptRange", {
        type: "readConversationTranscript",
        handle: wire.handle(handle),
        readHandle: wire.handle(readHandle),
        cursor: wire.handle(cursor),
        afterSequence,
      }),
    );
  }
  async closeRead(handle: string, readHandle: string): Promise<void> {
    await this.call("closed", {
      type: "closeConversationRead",
      handle: wire.handle(handle),
      readHandle: wire.handle(readHandle),
    });
  }
  async readRecords(
    handle: string,
    readHandle: string,
    cursor: string,
    afterIndex: number,
  ): Promise<NativeRecordPage> {
    wire.revision(afterIndex);
    return recordPage(
      await this.call("conversationRecords", {
        type: "readConversationRecords",
        handle: wire.handle(handle),
        readHandle: wire.handle(readHandle),
        cursor: wire.handle(cursor),
        afterIndex,
      }),
      cursor,
      afterIndex,
    );
  }
  async close(handle: string): Promise<void> {
    await this.call("closed", { type: "close", handle: wire.handle(handle) });
  }
}
