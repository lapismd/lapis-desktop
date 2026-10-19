import { expect, it, vi } from "vitest";
import { NativeImportSources } from "../../../src/lib/native/ai/import-sources.ts";
import type { NativeCall } from "../../../src/lib/native/vault-client.ts";
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}
function setup() {
  const trace: Record<string, unknown>[] = [];
  let allowed = true;
  const impl = vi.fn(
    async (request: Record<string, unknown>): Promise<unknown> => {
      if (request.type === "open") return "handle";
      if (request.type === "prepare") return "ticket";
      if (request.type === "list") return [];
      if (request.type === "preview") return { version: 1 };
    },
  );
  const call = vi.fn(async (command, args) => {
    expect(command).toBe("desktop_ai_imports");
    const request = args!.request as Record<string, unknown>;
    trace.push(request);
    return impl(request);
  }) as unknown as NativeCall;
  const sources = new NativeImportSources("vault", call, () => allowed);
  return {
    trace,
    impl,
    sources,
    disable: () => {
      allowed = false;
    },
  };
}
it("lazily admits read-only sources independently of provider admission", async () => {
  const { sources, trace } = setup();
  expect(trace).toEqual([]);
  expect(await sources.list(new AbortController().signal)).toEqual([]);
  expect(trace).toEqual([
    { type: "open", sessionId: "vault" },
    { type: "prepare", handle: "handle" },
    { type: "list", handle: "handle", ticket: "ticket" },
    { type: "cancel", handle: "handle", ticket: "ticket" },
  ]);
  await sources.close();
  expect(trace.at(-1)).toEqual({ type: "close", handle: "handle" });
});
it("does not start discovery for an already aborted or disabled caller", async () => {
  const { sources, trace, disable } = setup();
  const abort = new AbortController();
  abort.abort();
  await expect(sources.list(abort.signal)).rejects.toMatchObject({
    name: "AbortError",
  });
  disable();
  await expect(sources.list(new AbortController().signal)).rejects.toThrow(
    "disabled",
  );
  await sources.close();
  expect(trace).toEqual([]);
});
it("retires a prepared ticket if cancellation wins before worker dispatch", async () => {
  const { sources, impl, trace } = setup();
  const ticket = deferred<string>();
  impl.mockImplementation(async (request) =>
    request.type === "open"
      ? "handle"
      : request.type === "prepare"
        ? ticket.promise
        : undefined,
  );
  const abort = new AbortController();
  const reading = sources.list(abort.signal);
  const rejected = expect(reading).rejects.toMatchObject({
    name: "AbortError",
  });
  await vi.waitFor(() =>
    expect(trace.some((r) => r.type === "prepare")).toBe(true),
  );
  abort.abort();
  ticket.resolve("ticket");
  await rejected;
  expect(trace.some((r) => r.type === "list")).toBe(false);
  expect(trace.at(-1)).toEqual({
    type: "cancel",
    handle: "handle",
    ticket: "ticket",
  });
  await sources.close();
});
it("cancels a running snapshot and refuses its late result", async () => {
  const { sources, impl, trace } = setup();
  const snapshot = deferred<unknown>();
  impl.mockImplementation(async (r) =>
    r.type === "open"
      ? "handle"
      : r.type === "prepare"
        ? "ticket"
        : r.type === "preview"
          ? snapshot.promise
          : undefined,
  );
  const abort = new AbortController();
  const reading = sources.preview("source", abort.signal);
  const rejected = expect(reading).rejects.toMatchObject({
    name: "AbortError",
  });
  await vi.waitFor(() =>
    expect(trace.some((r) => r.type === "preview")).toBe(true),
  );
  abort.abort();
  await vi.waitFor(() =>
    expect(trace.some((r) => r.type === "cancel")).toBe(true),
  );
  snapshot.resolve({ version: 1 });
  await rejected;
  await sources.close();
});
it("fences native work immediately on close and waits for the running request", async () => {
  const { sources, impl, trace } = setup();
  const list = deferred<unknown>();
  impl.mockImplementation(async (r) =>
    r.type === "open"
      ? "handle"
      : r.type === "prepare"
        ? "ticket"
        : r.type === "list"
          ? list.promise
          : undefined,
  );
  const reading = sources.list(new AbortController().signal);
  const rejected = expect(reading).rejects.toMatchObject({
    name: "AbortError",
  });
  await vi.waitFor(() =>
    expect(trace.some((r) => r.type === "list")).toBe(true),
  );
  let closed = false;
  const close = sources.close().then(() => {
    closed = true;
  });
  await vi.waitFor(() =>
    expect(trace.some((r) => r.type === "close")).toBe(true),
  );
  expect(closed).toBe(false);
  list.resolve([]);
  await rejected;
  await close;
  await expect(
    sources.list(new AbortController().signal),
  ).rejects.toMatchObject({ name: "AbortError" });
});
it("rejects a result after trust changes and validates sanitized source rows", async () => {
  const { sources, impl, disable } = setup();
  impl.mockImplementation(async (r) => {
    if (r.type === "open") return "handle";
    if (r.type === "prepare") return "ticket";
    if (r.type === "list") {
      disable();
      return [];
    }
  });
  await expect(sources.list(new AbortController().signal)).rejects.toThrow(
    "disabled",
  );
  await sources.close();
  const next = setup();
  next.impl.mockImplementation(async (r) =>
    r.type === "open"
      ? "handle"
      : r.type === "prepare"
        ? "ticket"
        : r.type === "list"
          ? [{ selector: "/private/path" }]
          : undefined,
  );
  await expect(next.sources.list(new AbortController().signal)).rejects.toThrow(
    "invalid",
  );
  await expect(
    next.sources.preview("/private/path", new AbortController().signal),
  ).rejects.toThrow("selector");
  await next.sources.close();
});
it("retries failed admission and cleanup without starting a provider", async () => {
  const { sources, impl, trace } = setup();
  impl.mockRejectedValueOnce({
    code: "EBUSY",
    message: "Import temporarily unavailable",
  });
  await expect(sources.list(new AbortController().signal)).rejects.toThrow(
    "unavailable",
  );
  await sources.list(new AbortController().signal);
  impl.mockRejectedValueOnce({ code: "EBUSY", message: "Close interrupted" });
  await expect(sources.close()).rejects.toThrow("interrupted");
  await sources.close();
  expect(trace.filter((r) => r.type === "open")).toHaveLength(2);
  expect(trace.filter((r) => r.type === "close")).toHaveLength(2);
});

it("fences a completed read whose ticket retirement is still awaiting acknowledgement", async () => {
  const { sources, impl, trace } = setup();
  const release = deferred<void>();
  impl.mockImplementation(async (r) =>
    r.type === "open"
      ? "handle"
      : r.type === "prepare"
        ? "ticket"
        : r.type === "list"
          ? []
          : r.type === "cancel"
            ? release.promise
            : undefined,
  );
  const abort = new AbortController();
  const reading = sources.list(abort.signal);
  const rejected = expect(reading).rejects.toMatchObject({
    name: "AbortError",
  });
  await vi.waitFor(() =>
    expect(trace.some((r) => r.type === "cancel")).toBe(true),
  );
  abort.abort();
  release.resolve();
  await rejected;
  await sources.close();
});
