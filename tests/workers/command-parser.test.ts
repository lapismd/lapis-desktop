import { it, expect } from "vitest";
import { NativeCommandParser } from "../../src/lib/native/ai/command-parser.ts";
it("runs the bundled module worker while renderer timers continue", async () => {
  const parser = new NativeCommandParser();
  let ticks = 0;
  const timer = setInterval(() => ticks++, 1);
  try {
    const keys = Array.from(
      { length: 12_000 },
      (_, index) => `key_${index}: value_${index}`,
    ).join("\n");
    const result = await parser.parse(
      `---\ndescription: Worker parsing\n${keys}\n---\nWorker body`,
      "review.md",
      "review",
    );
    expect(result).toMatchObject({
      name: "review",
      description: "Worker parsing",
      template: "Worker body",
    });
    expect(ticks).toBeGreaterThan(0);
    await expect(
      parser.parse(
        "---\nkind: unsupported\n---\nBody",
        "invalid.md",
        "invalid",
      ),
    ).rejects.toThrow(/Unsupported command kind/);
  } finally {
    clearInterval(timer);
    parser.close();
  }
});
