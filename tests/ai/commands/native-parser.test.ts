import { describe, it, expect, vi } from "vitest";
import { NativeCommandParser } from "../../../src/lib/native/ai/command-parser.ts";
import { CommandParseError } from "../../../src/lib/ai/commands/markdown.ts";
import { CommandWorkerError } from "../../../src/lib/ai/commands/parser-port.ts";
class FakeWorker {
  onmessage?: Worker["onmessage"];
  onerror?: Worker["onerror"];
  onmessageerror?: Worker["onmessageerror"];
  postMessage = vi.fn();
  terminate = vi.fn();
  reply(data: unknown) {
    this.onmessage?.call(this as unknown as Worker, { data } as MessageEvent);
  }
}
describe("native command parsing worker", () => {
  it("allocates lazily, correlates concurrent replies, and retains parse diagnostics", async () => {
    const worker = new FakeWorker();
    const create = vi.fn(() => worker as unknown as Worker);
    const parser = new NativeCommandParser(create);
    expect(create).not.toHaveBeenCalled();
    const first = parser.parse("one", "one.md", "one");
    const second = parser.parse("two", "two.md", "two");
    expect(worker.postMessage.mock.calls).toEqual([
      [{ id: 1, content: "one", path: "one.md", name: "one" }],
      [{ id: 2, content: "two", path: "two.md", name: "two" }],
    ]);
    worker.reply({
      id: 2,
      error: { name: "CommandParseError", message: "Invalid kind" },
    });
    await expect(second).rejects.toBeInstanceOf(CommandParseError);
    worker.reply({ id: 1, data: { name: "one", template: "one" } });
    await expect(first).resolves.toMatchObject({ name: "one" });
    expect(create).toHaveBeenCalledTimes(1);
    parser.close();
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });
  it("rejects all pending work on failure and never parses on the renderer as a fallback", async () => {
    const worker = new FakeWorker();
    const parser = new NativeCommandParser(() => worker as unknown as Worker);
    const pending = parser.parse("---\n", "help.md", "help");
    const rejected = expect(pending).rejects.toBeInstanceOf(CommandWorkerError);
    worker.onerror?.call(
      worker as unknown as Worker,
      { preventDefault() {} } as ErrorEvent,
    );
    await rejected;
    await expect(parser.parse("plain", "help.md", "help")).rejects.toThrow(
      /worker failed/,
    );
    parser.close();
  });
  it("terminates timed-out work and fences requests after closure", async () => {
    vi.useFakeTimers();
    const worker = new FakeWorker();
    const parser = new NativeCommandParser(() => worker as unknown as Worker);
    try {
      const rejected = expect(
        parser.parse("plain", "help.md", "help"),
      ).rejects.toThrow(/timed out/);
      await vi.advanceTimersByTimeAsync(15_000);
      await rejected;
      expect(worker.terminate).toHaveBeenCalledTimes(1);
      parser.close();
      await expect(parser.parse("plain", "help.md", "help")).rejects.toThrow(
        /closed/,
      );
    } finally {
      parser.close();
      vi.useRealTimers();
    }
  });
});
