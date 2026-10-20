import type {
  NativeDispatchInput,
  NativeDispatchPort,
} from "../../../ai/conversations/dispatch-port.ts";
import { dispatchInput, dispatchView } from "./dispatch-wire.ts";
import * as wire from "./wire.ts";

/** Each method sends one intent; discovering retained state never resumes it. */
export class NativeConversationDispatch implements NativeDispatchPort {
  constructor(private readonly call: wire.NativeBackendCall) {}
  async begin(handle: string, input: NativeDispatchInput) {
    const safe = dispatchInput(input);
    const view =
      dispatchView(
        await this.call("canonicalDispatch", {
          type: "beginCanonicalDispatch",
          handle: wire.handle(handle),
          input: safe,
        }),
        safe.threadId,
        safe.requestId,
      ) ?? wire.invalid();
    if (
      (view.authored !== null) !== safe.authored ||
      view.recipients.length !== safe.recipients.length ||
      view.recipients.some(
        (r, i) =>
          r.requestId !== safe.recipients[i]!.requestId ||
          r.participant?.profileId !==
            safe.recipients[i]!.participant?.profileId,
      )
    )
      return wire.invalid();
    return view;
  }
  async status(handle: string, threadId: string, requestId?: string) {
    const view = dispatchView(
      await this.call("canonicalDispatch", {
        type: "canonicalDispatchStatus",
        handle: wire.handle(handle),
        threadId: wire.id(threadId),
        requestId: requestId === undefined ? null : wire.id(requestId),
      }),
      threadId,
      requestId,
    );
    if (view?.fresh) return wire.invalid();
    return view;
  }
  async stop(handle: string, threadId: string, requestId: string) {
    const view =
      dispatchView(
        await this.call("canonicalDispatch", {
          type: "stopCanonicalDispatch",
          handle: wire.handle(handle),
          threadId: wire.id(threadId),
          requestId: wire.id(requestId),
        }),
        threadId,
        requestId,
      ) ?? wire.invalid();
    if (!view.stopRequested || !view.stopped || !view.settled || view.fresh)
      return wire.invalid();
    return view;
  }
  async fence(handle: string, threadId: string, requestId: string) {
    const view =
      dispatchView(
        await this.call("canonicalDispatch", {
          type: "fenceCanonicalDispatch",
          handle: wire.handle(handle),
          threadId: wire.id(threadId),
          requestId: wire.id(requestId),
        }),
        threadId,
        requestId,
      ) ?? wire.invalid();
    if (!view.stopRequested || view.fresh) return wire.invalid();
    return view;
  }
}
