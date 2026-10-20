import { expect, it, vi } from "vitest";
import type { App } from "@lapis-notes/api";
import type { AcpTransport } from "@lapismd/ai";
import { createNativeAi } from "../../../src/lib/native/ai/services.ts";
import type {
  NativeCall,
  VaultDescriptor,
} from "../../../src/lib/native/vault-client.ts";

it("shows AI preparation from admission through probe cleanup and clears failed work", async () => {
  const now = vi.spyOn(Date, "now").mockReturnValue(0);
  let admit!: () => void;
  const admission = new Promise<void>((resolve) => {
    admit = resolve;
  });
  const handles: Array<{
    complete: ReturnType<typeof vi.fn>;
    fail: ReturnType<typeof vi.fn>;
  }> = [];
  const createProgress = vi.fn(() => {
    const handle = { complete: vi.fn(), fail: vi.fn() };
    handles.push(handle);
    return handle;
  });
  const app = {
    workspaceTrust: { trusted: true },
    safeMode: { disableOptionalCorePlugins: false },
    notifications: { createProgress, notify: vi.fn() },
  } as unknown as App;
  const raw = {
    targets: vi.fn(async () => [{ id: "codex", label: "Codex" }]),
    open: vi.fn(async () => ({
      sessionId: "probe",
      facts: {
        session: {
          models: { availableModels: [{ modelId: "advertised" }] },
        },
      },
    })),
    close: vi.fn(async () => {}),
    list: vi.fn(async () => []),
  };
  const call = vi.fn(async (command: string) => {
    if (command === "desktop_ai_admit") await admission;
  }) as unknown as NativeCall;
  const services = createNativeAi(
    app,
    { sessionId: "vault", profileId: "profile" } as VaultDescriptor,
    {
      call,
      createTransport: () => raw as unknown as AcpTransport,
    },
  );
  const loading = services.models!.listModels("codex", "acp");
  const second = services.models!.listModels("codex", "acp");
  expect(createProgress).toHaveBeenCalledTimes(1);
  expect(createProgress).toHaveBeenCalledWith(
    expect.objectContaining({
      title: "Preparing AI and loading models",
      source: "ai",
      location: "status",
      persistOnComplete: false,
      persistOnError: false,
    }),
  );
  expect(raw.open).not.toHaveBeenCalled();
  expect(handles[0]!.complete).not.toHaveBeenCalled();
  admit();
  expect(await loading).toEqual([
    expect.objectContaining({ model: "advertised" }),
  ]);
  await second;
  await services.models.listModels("codex", "acp");
  expect(raw.open).toHaveBeenCalledTimes(1);
  expect(createProgress).toHaveBeenCalledTimes(1);
  expect(raw.close).toHaveBeenCalledWith("probe");
  expect(handles[0]!.complete).toHaveBeenCalledOnce();

  const failure = new Error("probe failed");
  now.mockReturnValue(5 * 60_000 + 1);
  raw.open.mockRejectedValueOnce(failure);
  await expect(services.models!.listModels("codex", "acp")).rejects.toThrow(
    failure,
  );
  expect(handles[1]!.fail).toHaveBeenCalledWith(failure);
  expect(app.notifications.notify).not.toHaveBeenCalled();
  await services.close("close");
  expect(call).toHaveBeenLastCalledWith("desktop_ai_release", {
    request: { reload: false },
  });
  now.mockRestore();
});

it("invalidates discovery and admission only after a completed client installation", async () => {
  let state = "completed";
  let probes = 0;
  const app = {
    workspaceTrust: { trusted: true },
    safeMode: { disableOptionalCorePlugins: false },
    notifications: {
      createProgress: () => ({ complete: vi.fn(), fail: vi.fn() }),
      notify: vi.fn(),
    },
  } as unknown as App;
  const raw = {
    targets: async () => [{ id: "codex", label: "Codex" }],
    open: async () => ({
      sessionId: `probe-${++probes}`,
      facts: {
        session: {
          models: { availableModels: [{ modelId: `model-${probes}` }] },
        },
      },
    }),
    close: async () => {},
    list: async () => [],
  };
  const call = vi.fn(async (command: string) =>
    command === "desktop_ai_clients"
      ? { state, runtime_id: "codex", request_id: "original", error: null }
      : undefined,
  ) as unknown as NativeCall;
  const services = createNativeAi(
    app,
    { sessionId: "vault", profileId: "profile" } as VaultDescriptor,
    { call, createTransport: () => raw as unknown as AcpTransport },
  );
  expect((await services.models.listModels("codex"))[0]!.model).toBe("model-1");
  await services.models.listModels("codex");
  expect(probes).toBe(1);
  await services.clients!.service.outcome("original");
  expect((await services.models.listModels("codex"))[0]!.model).toBe("model-2");
  state = "failed";
  await services.clients!.service.install("another");
  await services.models.listModels("codex");
  expect(probes).toBe(2);
  state = "completed";
  await services.clients!.service.install("completed");
  expect((await services.models.listModels("codex"))[0]!.model).toBe("model-3");
  await services.close("close");
});
