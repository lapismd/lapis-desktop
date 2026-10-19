import { describe, expect, it, vi } from "vitest";
import type { AcpTransport } from "@lapismd/ai";
import { AdmittedAiTransport } from "../../../src/lib/native/ai/admitted-transport.ts";
function gate() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}
function fixture(activate = vi.fn(async () => {})) {
  const raw = {
    targets: vi.fn(async () => [{ id: "codex", label: "Codex" }]),
    list: vi.fn(async () => []),
    attach: vi.fn(async () => "subscription"),
    detach: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
  } as unknown as AcpTransport;
  const create = vi.fn(() => raw);
  const release = vi.fn(async (_reload: boolean) => {});
  const allowed = vi.fn(() => true);
  const scope = new AdmittedAiTransport({ create, activate, release, allowed });
  return { scope, raw, create, release, activate, allowed };
}
describe("App-owned admitted ACP transport", () => {
  it("recovers an uncertain detach by awaiting complete native revocation on close", async () => {
    const f = fixture();
    await f.scope.attach("session", 0, () => {});
    vi.mocked(f.raw.detach).mockRejectedValue(new Error("stale_subscription"));
    f.release.mockRejectedValueOnce(new Error("native cleanup pending"));
    await expect(f.scope.dispose(false)).rejects.toThrow(/cleanup/);
    await expect(f.scope.dispose(false)).resolves.toBeUndefined();
    expect(f.release).toHaveBeenCalledTimes(2);
    expect(f.release).toHaveBeenLastCalledWith(false);
    await expect(f.scope.targets()).rejects.toThrow(/closed/);
  });
  it("keeps admission active until failed stream detachment can be retried", async () => {
    const f = fixture();
    await f.scope.attach("session", 0, () => {});
    vi.mocked(f.raw.detach).mockRejectedValueOnce(new Error("detach failed"));
    await expect(f.scope.dispose(true)).rejects.toThrow(/cleanup/);
    try {
      expect(f.release).not.toHaveBeenCalled();
    } finally {
      await f.scope.dispose(true);
    }
    expect(f.raw.detach).toHaveBeenCalledTimes(2);
    expect(f.release).toHaveBeenCalledTimes(1);
  });
  it("allocates no native client until first use and shares one admission", async () => {
    const f = fixture();
    expect(f.create).not.toHaveBeenCalled();
    expect(f.activate).not.toHaveBeenCalled();
    await Promise.all([f.scope.targets(), f.scope.list()]);
    expect(f.activate).toHaveBeenCalledTimes(1);
    expect(f.create).toHaveBeenCalledTimes(1);
    await f.scope.dispose(false);
    expect(f.release).toHaveBeenCalledWith(false);
    await expect(f.scope.targets()).rejects.toThrow(/closed/);
  });
  it("prepares new client selection without revoking retained transport", async () => {
    const f = fixture();
    await f.scope.targets();
    f.scope.invalidateAdmission();
    await f.scope.targets();
    expect(f.activate).toHaveBeenCalledTimes(2);
    expect(f.create).toHaveBeenCalledTimes(1);
    expect(f.release).not.toHaveBeenCalled();
    await f.scope.dispose(false);
  });
  it("closing an unused service neither admits nor releases another owner", async () => {
    const f = fixture();
    await f.scope.dispose(true);
    expect(f.activate).not.toHaveBeenCalled();
    expect(f.create).not.toHaveBeenCalled();
    expect(f.release).not.toHaveBeenCalled();
  });
  it("fences an in-flight admission before it can allocate or dispatch", async () => {
    const held = gate();
    const f = fixture(vi.fn(() => held.promise));
    const opening = f.scope.targets();
    const outcome = expect(opening).rejects.toThrow(/closed/);
    const close = f.scope.dispose(false);
    held.release();
    await outcome;
    await close;
    expect(f.create).not.toHaveBeenCalled();
    expect(f.release).toHaveBeenCalledWith(false);
  });
  it("retries failed admission and rejects revoked workspace trust without IO", async () => {
    const activate = vi
      .fn()
      .mockRejectedValueOnce(new Error("denied"))
      .mockResolvedValue(undefined);
    const f = fixture(activate);
    await expect(f.scope.targets()).rejects.toThrow("denied");
    await f.scope.targets();
    expect(activate).toHaveBeenCalledTimes(2);
    f.allowed.mockReturnValue(false);
    await expect(f.scope.targets()).rejects.toThrow(/disabled/);
    expect(f.raw.targets).toHaveBeenCalledTimes(1);
    await f.scope.dispose(false);
  });
  it("drains an admitted call before releasing native authority", async () => {
    const held = gate();
    const f = fixture();
    vi.mocked(f.raw.targets).mockImplementation(async () => {
      await held.promise;
      return [];
    });
    const reading = f.scope.targets();
    await vi.waitFor(() => expect(f.raw.targets).toHaveBeenCalledTimes(1));
    const close = f.scope.dispose(true);
    expect(f.release).not.toHaveBeenCalled();
    held.release();
    await reading;
    await close;
    expect(f.release).toHaveBeenCalledWith(true);
  });
  it("detaches retained streams, fences late delivery and retries failed release", async () => {
    const f = fixture();
    const receive = vi.fn();
    await f.scope.attach("session", 0, receive);
    const deliver = vi.mocked(f.raw.attach).mock.calls[0]![2];
    f.release.mockRejectedValueOnce(new Error("cleanup unavailable"));
    await expect(f.scope.dispose(true)).rejects.toThrow(/cleanup/);
    deliver({} as never);
    expect(receive).not.toHaveBeenCalled();
    expect(f.raw.detach).toHaveBeenCalledWith("session", "subscription");
    await f.scope.dispose(true);
    expect(f.release).toHaveBeenCalledTimes(2);
  });
});
