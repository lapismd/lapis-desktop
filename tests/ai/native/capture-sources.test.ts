import { expect, it, vi } from "vitest";
import { NativeCaptureSources } from "../../../src/lib/native/ai/capture-sources.ts";
import { NativeImportSources } from "../../../src/lib/native/ai/import-sources.ts";
import type { NativeCall } from "../../../src/lib/native/vault-client.ts";
const delivery = "12345678-1234-1234-1234-123456789abc";
function setup() {
  const trace: Record<string, unknown>[] = [];
  let sequence = 0;
  const impl = vi.fn(async (r: Record<string, unknown>): Promise<unknown> => {
    if (r.type === "open") return `handle-${++sequence}`;
    if (r.type === "prepare") return `ticket-${++sequence}`;
    if (r.type === "list") return [];
    if (r.type === "nextCapture")
      return { type: "idle", eligible: 0, deferred: 0 };
  });
  const call = (async (_command, args) => {
    const request = args!.request as Record<string, unknown>;
    trace.push(request);
    return impl(request);
  }) as NativeCall;
  const sources = new NativeCaptureSources("vault", call, () => true);
  return { trace, impl, sources, call };
}
it("keeps manual and capture scopes independent and reconnects after Stop", async () => {
  const { trace, sources, call } = setup();
  const manual = new NativeImportSources("vault", call, () => true);
  const capture = sources.connect();
  expect(() => sources.connect()).toThrow("already active");
  expect(trace).toEqual([]);
  const signal = new AbortController().signal;
  await manual.list(signal);
  await capture.next(signal);
  expect(trace.filter((r) => r.type === "open")).toEqual([
    { type: "open", sessionId: "vault" },
    { type: "open", sessionId: "vault", purpose: "capture" },
  ]);
  await capture.close();
  await manual.list(signal);
  const replacement = sources.connect();
  await replacement.next(signal);
  expect(trace.filter((r) => r.type === "open")).toHaveLength(3);
  await sources.close();
  await manual.close();
  expect(trace.filter((r) => r.type === "close")).toHaveLength(3);
  expect(() => sources.connect()).toThrow("closed");
});
it("confirmation sends only an opaque delivery and retains it for a lost reply retry", async () => {
  const { trace, impl, sources } = setup();
  const capture = sources.connect();
  const signal = new AbortController().signal;
  await capture.next(signal);
  const ordinary = impl.getMockImplementation()!;
  let loseReply = true;
  impl.mockImplementation(async (request) => {
    if (request.type === "confirmCapture" && loseReply) {
      loseReply = false;
      throw new Error("Lost confirmation reply");
    }
    return ordinary(request);
  });
  await expect(capture.confirm(delivery, signal)).rejects.toThrow("Lost");
  await capture.confirm(delivery, signal);
  expect(trace.filter((r) => r.type === "confirmCapture")).toHaveLength(2);
  const request = trace.find((r) => r.type === "confirmCapture");
  expect(request).toMatchObject({ delivery });
  expect(Object.keys(request!).sort()).toEqual([
    "delivery",
    "handle",
    "ticket",
    "type",
  ]);
  const before = trace.length;
  await expect(capture.confirm("/private/source", signal)).rejects.toThrow(
    "Invalid",
  );
  expect(trace).toHaveLength(before);
  await sources.close();
});
it("drains a pending capture and rejects late results on factory close", async () => {
  const { trace, impl, sources } = setup();
  let finish!: (v: unknown) => void;
  const pending = new Promise((resolve) => {
    finish = resolve;
  });
  impl.mockImplementation(async (r) =>
    r.type === "open"
      ? "handle"
      : r.type === "prepare"
        ? "ticket"
        : r.type === "nextCapture"
          ? pending
          : undefined,
  );
  const capture = sources.connect();
  const reading = capture.next(new AbortController().signal);
  const rejected = expect(reading).rejects.toMatchObject({
    name: "AbortError",
  });
  await vi.waitFor(() =>
    expect(trace.some((r) => r.type === "nextCapture")).toBe(true),
  );
  let closed = false;
  const closing = sources.close().then(() => {
    closed = true;
  });
  await vi.waitFor(() =>
    expect(trace.some((r) => r.type === "close")).toBe(true),
  );
  expect(closed).toBe(false);
  finish({ type: "idle", eligible: 0, deferred: 0 });
  await rejected;
  await closing;
});
it("validates observation bounds and denies path-shaped deliveries", async () => {
  for (const value of [
    null,
    { type: "idle", eligible: 257, deferred: 0 },
    { type: "snapshot", delivery: "/source", deferred: 0 },
    { type: "idle", eligible: 0, deferred: -1 },
  ]) {
    const { impl, sources } = setup();
    impl.mockImplementation(async (r) =>
      r.type === "open"
        ? "handle"
        : r.type === "prepare"
          ? "ticket"
          : r.type === "nextCapture"
            ? value
            : undefined,
    );
    await expect(
      sources.connect().next(new AbortController().signal),
    ).rejects.toThrow("Invalid capture");
    await sources.close();
  }
});
