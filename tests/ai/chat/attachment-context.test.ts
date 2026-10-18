import { expect, it, vi } from "vitest";
import { attachmentContext } from "../../../src/lib/ai/chat/attachment-context.ts";

it("refuses unavailable, escaping or oversized attachments without silently omitting context", async () => {
  const read = vi.fn(async () => undefined);
  const signal = new AbortController().signal;
  for (const path of [
    "../outside",
    "/outside",
    "dir/../outside",
    "C:\\outside",
  ]) {
    await expect(attachmentContext([path], read, signal)).rejects.toThrow(
      /vault-relative/,
    );
  }
  expect(read).not.toHaveBeenCalled();
  await expect(attachmentContext(["missing.md"], read, signal)).rejects.toThrow(
    /unavailable/,
  );
  await expect(
    attachmentContext(["large.md"], async () => "a".repeat(65_537), signal),
  ).rejects.toThrow(/64 KiB/);
  await expect(
    attachmentContext(Array(9).fill("note.md"), read, signal),
  ).rejects.toThrow(/eight/);
});

it("cancellation during a vault read prevents late context delivery", async () => {
  let finish!: (text: string) => void;
  const abort = new AbortController();
  const pending = attachmentContext(
    ["note.md"],
    () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      }),
    abort.signal,
  );
  abort.abort();
  finish("late content");
  await expect(pending).rejects.toMatchObject({ name: "AbortError" });
});
