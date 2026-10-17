// SPDX-License-Identifier: Apache-2.0
// Retained source regression coverage; see src/lib/ai/NOTICE.md.
import { describe, expect, it } from "vitest";
import {
  reservedCommandMarkdown,
  RESERVED_SLASH_COMMANDS,
} from "../../../src/lib/ai/commands/reserved.ts";
import { seedReservedCommands } from "../../../src/lib/ai/commands/seed.ts";
import { MemoryUserAgentsStore } from "../../../src/lib/ai/commands/user-agents.ts";

describe("seedReservedCommands", () => {
  it("uses atomic missing-file creation when the native store supplies it", async () => {
    const created: string[] = [];
    const store = {
      list: async () => [],
      exists: async () => {
        throw new Error(
          "Do not race an existence check with default publication",
        );
      },
      write: async () => {
        throw new Error("Default seeding must not replace a file");
      },
      createIfMissing: async (name: string) => {
        created.push(name);
        return false;
      },
    };
    await seedReservedCommands(store);
    expect(created).toEqual(
      RESERVED_SLASH_COMMANDS.map((command) => command.name),
    );
  });
  it("writes reserved host files only when missing and overwrites those names on update", async () => {
    const store = new MemoryUserAgentsStore();
    await seedReservedCommands(store);
    expect(store.files.size).toBe(RESERVED_SLASH_COMMANDS.length);
    const original = store.files.get("help");
    expect(original).toContain("kind: host");
    await store.write("help", "user edited help");
    await store.write("review", "user prompt");
    await seedReservedCommands(store);
    expect(store.files.get("help")).toBe("user edited help");
    expect(store.files.get("review")).toBe("user prompt");
    await seedReservedCommands(store, { overwrite: true });
    expect(store.files.get("help")).toBe(
      reservedCommandMarkdown(RESERVED_SLASH_COMMANDS[0]!),
    );
    expect(store.files.get("review")).toBe("user prompt");
  });
});
