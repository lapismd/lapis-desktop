import { expect, it, vi } from "vitest";
import {
  AiCompute,
  type ComputeStatus,
  type ComputeRequest,
} from "../../../src/lib/ai/settings/compute.svelte.ts";
function status(): ComputeStatus {
  return {
    models: [
      { id: "downloaded", name: "Local model", installed: true, bytes: 400 },
    ],
    runtimePrepared: true,
    settings: {
      revision: 0,
      model: "downloaded",
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
it("acknowledged failure preserves its useful message and allows a new explicit request", async () => {
  let value = status();
  const requests: ComputeRequest[] = [];
  const report = vi.fn();
  const compute = new AiCompute(
    async (request) => {
      requests.push(structuredClone(request));
      if (request.type === "command")
        value = {
          ...value,
          requestId: request.command.requestId,
          outcome: "failed",
          failure: {
            code: "disk_full",
            message: "Free some disk space, then retry.",
          },
        };
      return structuredClone(value);
    },
    async (_label, run) => run(),
    vi.fn(),
    report,
  );
  await compute.refresh();
  expect(compute.value?.models[0].name).toBe("Local model");
  expect(await compute.command({ type: "download" })).toBe(false);
  expect(compute.pending).toBe(false);
  expect(report.mock.calls[0][0].message).toBe(
    "Free some disk space, then retry.",
  );
  expect(await compute.command({ type: "prepare" })).toBe(false);
  const commands = requests.filter((r) => r.type === "command");
  expect(commands[0].command.requestId).not.toBe(commands[1].command.requestId);
  expect(commands[1].command.action.type).toBe("prepare");
  await compute.close();
});
it("successful import selects its persistent identity without implicitly starting inference", async () => {
  let value = status();
  const commands: string[] = [];
  const compute = new AiCompute(
    async (request) => {
      if (request.type === "command") {
        commands.push(request.command.action.type);
        value = {
          ...value,
          requestId: request.command.requestId,
          outcome: "completed",
          runtime: { ...value.runtime, importedModel: "imported-sha256" },
        };
        value.models.push({
          id: "imported-sha256",
          name: "custom.gguf",
          installed: true,
          bytes: 123,
        });
      }
      return structuredClone(value);
    },
    async (_label, run) => run(),
    vi.fn(),
    vi.fn(),
  );
  await compute.refresh();
  expect(
    await compute.command({ type: "import", path: "/tmp/custom.gguf" }),
  ).toBe(true);
  expect(compute.draft.model).toBe("imported-sha256");
  await compute.refresh();
  expect(compute.draft.model).toBe("imported-sha256");
  expect(compute.value?.models).toHaveLength(2);
  expect(commands).toEqual(["import"]);
  await compute.close();
});
it("an explicit native validation refusal releases pending state and keeps the invalid draft", async () => {
  const request = vi.fn(async (request: ComputeRequest) => {
    if (request.type === "command")
      throw Object.assign(new Error("Choose a valid model"), {
        code: "EINVAL",
      });
    return status();
  });
  const compute = new AiCompute(
    request,
    async (_label, run) => run(),
    vi.fn(),
    vi.fn(),
  );
  await compute.refresh();
  compute.edit({ model: "invalid://model" });
  expect(
    await compute.command({ type: "configure", settings: compute.draft }),
  ).toBe(false);
  expect(compute.pending).toBe(false);
  expect(compute.draft.model).toBe("invalid://model");
  await compute.close();
});
it("reconciling an uncertain command never applies a different requested action's import selection", async () => {
  let value = status();
  let attempts = 0;
  const compute = new AiCompute(
    async (request) => {
      if (request.type === "command")
        value = {
          ...value,
          requestId: request.command.requestId,
          outcome: ++attempts === 1 ? "unknown" : "completed",
          runtime: { ...value.runtime, importedModel: "older-import" },
        };
      return structuredClone(value);
    },
    async (_label, run) => run(),
    vi.fn(),
    vi.fn(),
  );
  await compute.refresh();
  expect(await compute.command({ type: "start" })).toBe(false);
  expect(
    await compute.command({ type: "import", path: "/tmp/other.gguf" }),
  ).toBe(true);
  expect(compute.draft.model).toBe("downloaded");
  await compute.close();
});
