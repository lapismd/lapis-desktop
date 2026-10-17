import { describe, expect, it } from "vitest";
import {
  decodeMemoryPathSegment,
  episodicMemoryPath,
} from "../../../src/lib/ai/memory/paths.ts";

describe("derived memory path encoding", () => {
  it.each([
    "Notes/Atlas",
    "Notes~Draft",
    "Notes~2FDraft",
    "~",
    "%",
    "café/📚",
    "a b",
  ])("round trips %s", (scope) => {
    const path = episodicMemoryPath(
      { kind: "project", projectDir: scope },
      "conversation",
      "entry",
    );
    expect(decodeMemoryPathSegment(path.split("/")[3]!)).toBe(scope);
  });
  it("does not collide literal escape-looking names with separators", () => {
    const path = (projectDir: string) =>
      episodicMemoryPath(
        { kind: "project", projectDir },
        "conversation",
        "entry",
      );
    expect(path("Notes~2FDraft")).not.toBe(path("Notes/Draft"));
  });
});
