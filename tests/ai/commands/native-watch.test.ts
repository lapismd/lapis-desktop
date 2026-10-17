import { afterEach, describe, expect, it, vi } from "vitest";
import type { NativeCall } from "../../../src/lib/native/vault-client.ts";
import { NativeUserAgentsStore } from "../../../src/lib/native/ai/user-commands.ts";

const stores: NativeUserAgentsStore[] = [];
const releases: (() => void)[] = [];
afterEach(async () => {
  for (const release of releases.splice(0)) release();
  await Promise.all(stores.splice(0).map((store) => store.close()));
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function fixture() {
  vi.useFakeTimers();
  const files = new Map<string, string>();
  const report = vi.fn();
  let failure: Error | undefined;
  let held: Promise<void> | undefined;
  const call = vi.fn(async (_command: string, args: unknown) => {
    const operation = (
      args as {
        operation: { type: string; name: string; content: string };
      }
    ).operation;
    if (operation.type === "list") {
      const snapshot = {
        root: "/user/.lapis/agents/commands",
        files: [...files].map(([name, content]) => ({ name, content })),
      };
      const waiting = held;
      const problem = failure;
      held = undefined;
      if (waiting) await waiting;
      if (problem) throw problem;
      return snapshot;
    }
    if (operation.type === "createIfMissing" && files.has(operation.name))
      return false;
    files.set(operation.name, operation.content);
    return operation.type === "createIfMissing" ? true : undefined;
  });
  const store = new NativeUserAgentsStore(
    "vault-admission",
    call as NativeCall,
    report,
  );
  stores.push(store);
  return {
    store,
    files,
    call,
    report,
    fail(error?: Error) {
      failure = error;
    },
    hold() {
      let release!: () => void;
      held = new Promise<void>((resolve) => {
        release = resolve;
      });
      releases.push(release);
      return release;
    },
  };
}
const tick = () => vi.advanceTimersByTimeAsync(1000);

describe("external native user-command refresh", () => {
  it("lazily observes additions, edits and removals only while subscribed", async () => {
    const { store, files, call } = fixture();
    const changed = vi.fn();
    await tick();
    expect(call).not.toHaveBeenCalled();
    const stop = store.subscribe(changed);
    await tick();
    expect(call).toHaveBeenCalledTimes(1);
    expect(changed).not.toHaveBeenCalled();
    files.set("review", "# Initial command");
    await tick();
    expect(changed).toHaveBeenCalledTimes(1);
    files.set("review", "# External revision");
    await tick();
    expect(changed).toHaveBeenCalledTimes(2);
    await tick();
    expect(changed).toHaveBeenCalledTimes(2);
    files.delete("review");
    await tick();
    expect(changed).toHaveBeenCalledTimes(3);
    stop();
    const requests = call.mock.calls.length;
    await tick();
    expect(call).toHaveBeenCalledTimes(requests);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("uses one polling lease for multiple listeners and ignores inventory order", async () => {
    const { store, files, call } = fixture();
    files.set("alfa", "A");
    files.set("beta", "B");
    await store.list();
    const first = vi.fn();
    const second = vi.fn();
    const stopFirst = store.subscribe(first);
    const stopSecond = store.subscribe(second);
    files.delete("alfa");
    files.set("alfa", "A");
    await tick();
    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
    expect(call).toHaveBeenCalledTimes(2);
    stopFirst();
    files.set("beta", "changed");
    await tick();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    stopSecond();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("retains the last snapshot across bounded polling failures and reports recovery", async () => {
    const { store, files, fail, report } = fixture();
    await store.list();
    const changed = vi.fn();
    store.subscribe(changed);
    fail(new Error("Commands are unreadable"));
    files.set("review", "External text");
    await tick();
    await tick();
    expect(report).toHaveBeenCalledTimes(1);
    expect(changed).not.toHaveBeenCalled();
    fail();
    await tick();
    expect(changed).toHaveBeenCalledTimes(1);
    fail(new Error("Commands are unreadable"));
    await tick();
    expect(report).toHaveBeenCalledTimes(2);
  });

  it("does not overlap reads, drains closure and fences a late snapshot", async () => {
    const { store, files, call, hold } = fixture();
    await store.list();
    const changed = vi.fn();
    store.subscribe(changed);
    files.set("review", "External text");
    const release = hold();
    await tick();
    await tick();
    expect(call).toHaveBeenCalledTimes(2);
    let closed = false;
    const closing = store.close().then(() => {
      closed = true;
    });
    await Promise.resolve();
    expect(closed).toBe(false);
    release();
    await closing;
    expect(changed).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    await tick();
    expect(call).toHaveBeenCalledTimes(2);
  });

  it("keeps acknowledgements immediate and does not duplicate them on the next poll", async () => {
    const { store, files } = fixture();
    await store.list();
    const changed = vi.fn();
    store.subscribe(changed);
    expect(await store.createIfMissing("review", "Default")).toBe(true);
    expect(changed).toHaveBeenCalledTimes(1);
    await tick();
    expect(changed).toHaveBeenCalledTimes(1);
    await store.write("review", "Explicit replacement");
    expect(changed).toHaveBeenCalledTimes(2);
    expect(await store.createIfMissing("review", "Do not replace")).toBe(false);
    await tick();
    expect(changed).toHaveBeenCalledTimes(2);
    files.set("review", "Later external edit");
    await tick();
    expect(changed).toHaveBeenCalledTimes(3);
  });

  it("a newer explicit read supersedes an older poll and unsubscription fences delivery", async () => {
    const { store, files, hold } = fixture();
    await store.list();
    const changed = vi.fn();
    const stop = store.subscribe(changed);
    files.set("review", "Old snapshot");
    const release = hold();
    await tick();
    files.set("review", "Newer snapshot");
    await store.list();
    release();
    await vi.advanceTimersByTimeAsync(0);
    expect(changed).not.toHaveBeenCalled();
    await tick();
    expect(changed).not.toHaveBeenCalled();
    const releaseAgain = hold();
    files.set("review", "Do not publish after unsubscribe");
    await tick();
    stop();
    releaseAgain();
    await vi.advanceTimersByTimeAsync(0);
    expect(changed).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("a successful newer read fences an obsolete polling failure", async () => {
    const { store, fail, hold, report } = fixture();
    await store.list();
    store.subscribe(vi.fn());
    fail(new Error("Old unreadable snapshot"));
    const release = hold();
    await tick();
    fail();
    await store.list();
    release();
    await vi.advanceTimersByTimeAsync(0);
    expect(report).not.toHaveBeenCalled();
  });

  it("re-subscribing during an old read retains one lease and observes fresh state", async () => {
    const { store, files, hold, call } = fixture();
    await store.list();
    const first = vi.fn();
    const second = vi.fn();
    const stop = store.subscribe(first);
    files.set("review", "Obsolete snapshot");
    const release = hold();
    await tick();
    stop();
    store.subscribe(second);
    files.set("review", "Current snapshot");
    await tick();
    expect(call).toHaveBeenCalledTimes(2);
    release();
    await vi.advanceTimersByTimeAsync(0);
    expect(second).not.toHaveBeenCalled();
    await tick();
    expect(call).toHaveBeenCalledTimes(3);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(await store.list()).toEqual([
      { name: "review", content: "Current snapshot" },
    ]);
  });

  it("reporting failures cannot turn a durable acknowledgement into a write failure", async () => {
    const { store, report } = fixture();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    report.mockImplementation(() => {
      throw new Error("Notification unavailable");
    });
    store.subscribe(() => {
      throw new Error("Refresh unavailable");
    });
    await expect(
      store.write("review", "Durable text"),
    ).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalled();
  });
});
