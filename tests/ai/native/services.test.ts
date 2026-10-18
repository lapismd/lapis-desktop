import { expect, it, vi } from "vitest";
import type { App } from "@lapis-notes/api";
import type { AcpTransport } from "@lapismd/ai";
import { createNativeAi } from "../../../src/lib/native/ai/services.ts";
import type {
  NativeCall,
  VaultDescriptor,
} from "../../../src/lib/native/vault-client.ts";

it("shows AI preparation from admission through probe cleanup and clears failed work", async () => {
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
  expect(raw.close).toHaveBeenCalledWith("probe");
  expect(handles[0]!.complete).toHaveBeenCalledOnce();

  const failure = new Error("probe failed");
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
});
