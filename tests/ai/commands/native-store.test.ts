import { describe, expect, it, vi } from "vitest";
import type { NativeCall } from "../../../src/lib/native/vault-client.ts";
import { NativeUserAgentsStore } from "../../../src/lib/native/ai/user-commands.ts";

describe("native user command store", () => {
  it("uses only opaque vault admission and named operations; acknowledged changes notify", async () => {
    const calls: unknown[] = [];
    const call: NativeCall = async <T>(command: string, args?: unknown) => {
      calls.push({ command, args });
      const operation = (args as { operation: { type: string } }).operation;
      return (
        operation.type === "list"
          ? {
              root: "/user/.lapis/agents/commands",
              files: [{ name: "review", content: "Review notes" }],
            }
          : operation.type === "exists"
      ) as T;
    };
    const store = new NativeUserAgentsStore("opaque-vault", call);
    const changed = vi.fn();
    const stop = store.subscribe(changed);
    expect(calls).toEqual([]);
    expect(await store.list()).toEqual([
      { name: "review", content: "Review notes" },
    ]);
    expect(store.root).toBe("/user/.lapis/agents/commands");
    expect(await store.exists("review")).toBe(true);
    expect(await store.createIfMissing("review", "default")).toBe(false);
    expect(changed).not.toHaveBeenCalled();
    await store.write("review", "explicit update");
    expect(changed).toHaveBeenCalledTimes(1);
    stop();
    await store.write("review", "another update");
    expect(changed).toHaveBeenCalledTimes(1);
    expect(calls).toEqual([
      {
        command: "desktop_ai_user_commands",
        args: { sessionId: "opaque-vault", operation: { type: "list" } },
      },
      {
        command: "desktop_ai_user_commands",
        args: {
          sessionId: "opaque-vault",
          operation: { type: "exists", name: "review" },
        },
      },
      {
        command: "desktop_ai_user_commands",
        args: {
          sessionId: "opaque-vault",
          operation: {
            type: "createIfMissing",
            name: "review",
            content: "default",
          },
        },
      },
      {
        command: "desktop_ai_user_commands",
        args: {
          sessionId: "opaque-vault",
          operation: {
            type: "write",
            name: "review",
            content: "explicit update",
          },
        },
      },
      {
        command: "desktop_ai_user_commands",
        args: {
          sessionId: "opaque-vault",
          operation: {
            type: "write",
            name: "review",
            content: "another update",
          },
        },
      },
    ]);
    await store.close();
  });

  it("drains an admitted write on closure, fences notifications and rejects new calls", async () => {
    let release!: () => void;
    const response = new Promise<void>((resolve) => {
      release = resolve;
    });
    const call = vi.fn(() => response) as NativeCall;
    const store = new NativeUserAgentsStore("vault", call);
    const changed = vi.fn();
    store.subscribe(changed);
    const writing = store.write("help", "pending");
    let closed = false;
    const closing = store.close().then(() => {
      closed = true;
    });
    await Promise.resolve();
    expect(closed).toBe(false);
    await expect(store.exists("help")).rejects.toThrow("closed");
    release();
    await writing;
    await closing;
    expect(changed).not.toHaveBeenCalled();
    expect(call).toHaveBeenCalledTimes(1);
  });

  it("preserves native failures without reporting a successful change", async () => {
    const call = vi.fn(async () => {
      throw { code: "EACCES", message: "Commands are read-only" };
    }) as NativeCall;
    const store = new NativeUserAgentsStore("vault", call);
    const changed = vi.fn();
    store.subscribe(changed);
    await expect(store.write("help", "blocked")).rejects.toMatchObject({
      code: "EACCES",
      message: "Commands are read-only",
    });
    expect(changed).not.toHaveBeenCalled();
    await store.close();
  });

  it("a subscriber failure does not turn an acknowledged write into a failed write", async () => {
    const report = vi.fn();
    const store = new NativeUserAgentsStore(
      "vault",
      vi.fn(async () => undefined) as NativeCall,
      report,
    );
    store.subscribe(() => {
      throw new Error("Refresh failed");
    });
    await expect(store.write("help", "saved")).resolves.toBeUndefined();
    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Refresh failed" }),
    );
    await store.close();
  });
});
