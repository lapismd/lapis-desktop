import { describe, expect, it } from "vitest";
import { RedactionScope } from "@lapismd/agent-redaction";
import { MemoryCaptureBoundary } from "../../../src/lib/ai/memory/capture-port.ts";
describe("retained memory capture", () => {
  it("sanitizes before the first index write and rescans legacy reads without changing execution locations", async () => {
    const secret = "synthetic-lapis-memory-private-material";
    const scope = new RedactionScope({
      roots: [{ kind: "workspace", id: "demo", path: "/private/demo" }],
    });
    scope.registerSecrets([secret]);
    const capture = new MemoryCaptureBoundary(scope);
    const writes: unknown[] = [];
    const raw = {
      content: `${secret} /private/demo/README`,
      location: { scopeDir: "Projects/Demo", conversationId: "conversation" },
    };
    const storage = capture.port({
      async put(value: unknown) {
        writes.push(value);
      },
      async read() {
        return raw;
      },
    });
    await storage.put(raw);
    expect(JSON.stringify(writes)).not.toContain(secret);
    expect(JSON.stringify(writes)).not.toContain("/private/demo");
    expect(JSON.stringify(writes)).toContain("$WORKSPACE[demo]/README");
    expect(await storage.read()).toEqual(writes[0]);
    const executionArgs: unknown[] = [];
    const execution = capture.port(
      {
        async read(location: string) {
          executionArgs.push(location);
          return raw;
        },
      },
      true,
    );
    await execution.read("/private/demo/conversation");
    expect(executionArgs).toEqual(["/private/demo/conversation"]);
    expect(raw.content).toContain(secret);
    const malformed: unknown[] = [];
    Object.defineProperty(malformed, "0", {
      get() {
        throw new Error("getter executed");
      },
    });
    await expect(storage.put(malformed)).rejects.toThrow(
      "memory_capture_invalid",
    );
    expect(writes).toHaveLength(1);
  });

  it("rejects capture that changes an execution location or omits its payload", async () => {
    const scope = new RedactionScope();
    scope.registerSecrets(["private-location"]);
    const boundary = new MemoryCaptureBoundary(scope);
    const repository = boundary.port(
      {
        async read() {
          return {
            location: { scopeDir: "private-location", conversationId: "id" },
            transcript: [],
          };
        },
      },
      true,
    );
    await expect(repository.read()).rejects.toThrow(
      "memory_capture_location_rejected",
    );
    const omitted = new MemoryCaptureBoundary({
      value: async () => ({ status: "omitted", reason: "detector_failure" }),
    });
    await expect(omitted.clean({ text: "sensitive" })).rejects.toThrow(
      "memory_capture_rejected",
    );
  });
});
