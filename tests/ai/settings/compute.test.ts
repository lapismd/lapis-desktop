import { expect, it, vi } from "vitest";
import {
  AiCompute,
  type ComputeStatus,
  type ComputeRequest,
} from "../../../src/lib/ai/settings/compute.svelte.ts";
function initial(): ComputeStatus {
  return {
    models: [],
    runtimePrepared: false,
    settings: {
      revision: 0,
      model: null,
      memoryGb: null,
      sharing: false,
      peers: {},
      targetPeer: null,
    },
    requestId: null,
    outcome: null,
    runtime: { state: "off", invitation: null, progress: null },
  };
}
it("status and edits never issue lifecycle commands; unsaved settings survive refresh", async () => {
  const request = vi.fn(async (_action: ComputeRequest) => initial()),
    changed = vi.fn();
  const compute = new AiCompute(
    request,
    async (_title, run) => run(),
    changed,
    vi.fn(),
  );
  await compute.refresh();
  compute.edit({ model: "my/model:Q4" });
  await compute.refresh();
  expect(compute.draft.model).toBe("my/model:Q4");
  expect(
    request.mock.calls.every(
      ([action]) => (action as ComputeRequest).type === "status",
    ),
  ).toBe(true);
  await compute.close();
  expect(changed).not.toHaveBeenCalled();
});
it("an unknown command retains its identity and cannot silently launch a new action", async () => {
  let value = initial();
  const commands: ComputeRequest[] = [];
  const report = vi.fn();
  const compute = new AiCompute(
    async (request) => {
      if (request.type === "command") {
        commands.push(structuredClone(request));
        value = {
          ...value,
          requestId: request.command.requestId,
          outcome: "unknown",
        };
      }
      return structuredClone(value);
    },
    async (_title, run) => run(),
    vi.fn(),
    report,
  );
  await compute.refresh();
  expect(await compute.command({ type: "start" })).toBe(false);
  expect(compute.pending).toBe(true);
  expect(await compute.command({ type: "download" })).toBe(false);
  expect(commands[0]).toEqual(commands[1]);
  expect(report).toHaveBeenCalledTimes(1);
  await compute.stop();
  expect(compute.pending).toBe(false);
  await compute.close();
});

it("stops only the exact native runtime owner last observed by this view", async () => {
  let value = initial();
  const ownerId = crypto.randomUUID();
  value.runtime = { ...value.runtime, state: "serving", ownerId };
  const request = vi.fn(async (request: ComputeRequest) => {
    if (request.type === "command") {
      expect(request.command.action).toEqual({ type: "stop", ownerId });
      value = {
        ...value,
        runtime: { ...value.runtime, state: "off", ownerId: null },
      };
    }
    return structuredClone(value);
  });
  const compute = new AiCompute(
    request,
    async (_title, run) => run(),
    vi.fn(),
    vi.fn(),
  );
  await compute.refresh();
  await compute.stop();
  expect(compute.value?.runtime.state).toBe("off");
  await compute.close();
});

it("file selection never issues compute commands and reports chooser failures", async () => {
  const request = vi.fn(async () => initial());
  const report = vi.fn();
  const choose = vi
    .fn<() => Promise<string | null>>()
    .mockResolvedValueOnce("/tmp/model.gguf")
    .mockResolvedValueOnce(null)
    .mockRejectedValueOnce(new Error("Chooser unavailable"));
  const compute = new AiCompute(
    request,
    async (_title, run) => run(),
    vi.fn(),
    report,
    choose,
  );
  expect(compute.canPickFile).toBe(true);
  expect(choose).not.toHaveBeenCalled();
  expect(await compute.pickFile()).toBe("/tmp/model.gguf");
  expect(await compute.pickFile()).toBeNull();
  expect(await compute.pickFile()).toBeNull();
  expect(report).toHaveBeenCalledOnce();
  expect(request).not.toHaveBeenCalled();
  await compute.close();
  expect(await compute.pickFile()).toBeNull();
  expect(choose).toHaveBeenCalledTimes(3);
});
