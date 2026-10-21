import { expect, it, vi } from "vitest";
import { NativeImportSources } from "../../../src/lib/native/ai/import-sources.ts";
import type { NativeCall } from "../../../src/lib/native/vault-client.ts";
function setup() {
  const trace: Record<string, unknown>[] = [];
  const impl = vi.fn(async (r: Record<string, unknown>): Promise<unknown> => {
    if (r.type === "open") return "handle";
    if (r.type === "prepare") return crypto.randomUUID();
    if (r.type === "folders")
      return {
        folders: [
          {
            selector: "a".repeat(64),
            label: "Project",
            location: "~/Project",
            count: 1,
          },
        ],
        indexed: 1,
        complete: true,
        limited: false,
      };
    if (r.type === "sessions") return { rows: [], total: 0, next: null };
    if (r.type === "startPreview" || r.type === "nextPreview")
      return { reader: r.reader, entries: [], order: [], progress: 50 };
  });
  const call = vi.fn(async (command, args) => {
    expect(command).toBe("desktop_ai_imports");
    const r = args!.request as Record<string, unknown>;
    trace.push(r);
    return impl(r);
  }) as unknown as NativeCall;
  return {
    sources: new NativeImportSources("vault", call, () => true),
    trace,
    impl,
  };
}
it("uses only opaque indexed selectors and allocates read identity before dispatch", async () => {
  const f = setup(),
    signal = new AbortController().signal;
  expect(await f.sources.folders("cursor", true, signal)).toMatchObject({
    indexed: 1,
    complete: true,
  });
  await f.sources.sessions("a".repeat(64), undefined, signal);
  const first = await f.sources.startPreview("b".repeat(64), signal);
  await f.sources.nextPreview(first.reader, signal);
  await f.sources.releasePreview(first.reader, signal);
  expect(f.trace.find((r) => r.type === "startPreview")).toMatchObject({
    reader: first.reader,
    selector: "b".repeat(64),
  });
  await expect(
    f.sources.sessions("/private/path", undefined, signal),
  ).rejects.toThrow("selector");
  await expect(f.sources.startPreview("/private/path", signal)).rejects.toThrow(
    "selector",
  );
  await expect(f.sources.nextPreview("/private/path", signal)).rejects.toThrow(
    "selector",
  );
  await f.sources.close();
});
it("releases a native preview whose start reply is abandoned", async () => {
  const f = setup();
  let resolve!: (v: unknown) => void,
    reader = "";
  f.impl.mockImplementation(async (r) => {
    if (r.type === "open") return "handle";
    if (r.type === "prepare") return crypto.randomUUID();
    if (r.type === "startPreview") {
      reader = String(r.reader);
      return new Promise((r) => {
        resolve = r;
      });
    }
  });
  const abort = new AbortController(),
    pending = f.sources.startPreview("b".repeat(64), abort.signal);
  const rejected = expect(pending).rejects.toMatchObject({
    name: "AbortError",
  });
  await vi.waitFor(() => expect(reader).not.toBe(""));
  abort.abort();
  resolve({ reader, entries: [], order: [], progress: 50 });
  await rejected;
  expect(f.trace.find((r) => r.type === "releasePreview")).toMatchObject({
    reader,
  });
  await f.sources.close();
});
it("rejects raw metadata paths and wrong folder ownership from a native response", async () => {
  const f = setup();
  f.impl.mockImplementation(async (r) =>
    r.type === "open"
      ? "handle"
      : r.type === "prepare"
        ? crypto.randomUUID()
        : r.type === "folders"
          ? {
              folders: [
                {
                  selector: "a".repeat(64),
                  label: "/private/source",
                  location: "/private/source",
                  count: 1,
                },
              ],
              indexed: 1,
              complete: true,
              limited: false,
            }
          : undefined,
  );
  await expect(
    f.sources.folders("opencode", false, new AbortController().signal),
  ).rejects.toThrow("index");
  await f.sources.close();
});
