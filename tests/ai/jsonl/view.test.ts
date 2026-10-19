// SPDX-License-Identifier: Apache-2.0
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  mount: vi.fn(),
  unmount: vi.fn(),
  cancel: vi.fn(),
  read: vi.fn(),
}));
vi.mock("svelte", () => ({ mount: mocks.mount, unmount: mocks.unmount }));
vi.mock("@lapis-notes/api", () => ({
  TFile: class {},
  TextFileView: class {
    actions: unknown[] = [];
    data = "";
    file: { name: string; path: string } | null = null;
    editor = { cancelDocumentLoad: mocks.cancel };
    constructor(
      readonly leaf: {
        app: unknown;
        containerEl: HTMLElement;
        contentEl: HTMLElement;
      },
    ) {}
    get app() {
      return this.leaf.app;
    }
    get containerEl() {
      return this.leaf.containerEl;
    }
    get contentEl() {
      return this.leaf.contentEl;
    }
    onLoadFile(file: unknown) {
      return mocks.read(file);
    }
  },
}));
vi.mock("../../../src/components/ai/jsonl/AiJsonlPanel.svelte", () => ({
  default: { name: "AiJsonlPanel" },
}));
import { AiJsonlView } from "../../../src/components/ai/views/jsonl-view.ts";
import { AiOperations } from "../../../src/lib/ai/plugin/operations.ts";
function fixture() {
  const operations = new AiOperations();
  const app = {
    id: "owned-test-app",
    vault: { on: vi.fn().mockReturnValue({}), offref: vi.fn() },
  };
  const containerEl = {
    classList: { add: vi.fn() },
    replaceChildren: vi.fn(),
  } as unknown as HTMLElement;
  const host = { active: true, operations };
  const contentEl = {
    classList: { add: vi.fn() },
    replaceChildren: vi.fn(),
  } as unknown as HTMLElement;
  const view = new AiJsonlView(
    { app, containerEl, contentEl } as never,
    host as never,
  );
  return { view, app, containerEl, contentEl, host };
}
describe("AiJsonlView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mount.mockReturnValue({});
    mocks.unmount.mockResolvedValue(undefined);
    mocks.read.mockResolvedValue(undefined);
  });
  it("mounts a read-only surface with live file data and path", async () => {
    const { view, app, contentEl } = fixture();
    view.file = {
      name: "transcript.jsonl",
      path: "Notes/transcript.jsonl",
    } as never;
    view.setViewData('{"event":"ready"}\n');
    view.onload();
    expect(view.getViewType()).toBe("ai-jsonl");
    expect(view.getDisplayText()).toBe("transcript.jsonl");
    expect(view.getIcon()).toBe("messages-square");
    expect(view.getViewData()).toBe('{"event":"ready"}\n');
    const options = mocks.mount.mock.calls[0][1];
    expect(options.target).toBe(contentEl);
    expect(options.props).toMatchObject({
      app,
      data: view.data,
      filePath: "Notes/transcript.jsonl",
    });
    view.setViewData('{"event":"updated"}\n');
    view.file = { name: "agents.jsonl", path: "Notes/agents.jsonl" } as never;
    expect(options.props.data).toBe('{"event":"updated"}\n');
    expect(options.props.filePath).toBe("Notes/agents.jsonl");
    await view.save(true);
    expect(view.getViewData()).toBe('{"event":"updated"}\n');
    await view.onunload();
    expect(mocks.unmount).toHaveBeenCalledOnce();
    expect(mocks.cancel).toHaveBeenCalledOnce();
    expect(app.vault.offref).toHaveBeenCalledTimes(2);
  });
  it("accepts JSONL case-insensitively and rejects other file types", () => {
    const { view } = fixture();
    expect(view.canAcceptExtension("jsonl")).toBe(true);
    expect(view.canAcceptExtension(".JSONL")).toBe(true);
    expect(view.canAcceptExtension("json")).toBe(false);
  });
  it("drains file reads and component teardown and rejects closed admission", async () => {
    const { view, host } = fixture();
    let finishRead!: () => void;
    let finishUnmount!: () => void;
    mocks.read.mockReturnValue(
      new Promise<void>((resolve) => {
        finishRead = resolve;
      }),
    );
    mocks.unmount.mockReturnValue(
      new Promise<void>((resolve) => {
        finishUnmount = resolve;
      }),
    );
    view.onload();
    const read = view.onLoadFile({ path: "events.jsonl" } as never);
    host.active = false;
    let settled = false;
    const closed = host.operations.closeViews().then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(mocks.cancel).toHaveBeenCalledOnce();
    expect(settled).toBe(false);
    finishUnmount();
    await Promise.resolve();
    expect(settled).toBe(false);
    finishRead();
    await Promise.all([read, closed]);
    await expect(view.onLoadFile({} as never)).rejects.toThrow(
      "AI is disabled",
    );
    expect(mocks.read).toHaveBeenCalledOnce();
    await view.onunload();
    expect(mocks.unmount).toHaveBeenCalledOnce();
  });
  it("keeps the loading surface pending until overlapping reads drain", async () => {
    const { view } = fixture();
    view.onload();
    const states: boolean[] = [];
    const unsubscribe = mocks.mount.mock.calls[0][1].props.loading.subscribe(
      (value: boolean) => states.push(value),
    );
    let first!: () => void, second!: () => void;
    mocks.read
      .mockReturnValueOnce(
        new Promise<void>((resolve) => {
          first = resolve;
        }),
      )
      .mockReturnValueOnce(
        new Promise<void>((resolve) => {
          second = resolve;
        }),
      );
    const one = view.onLoadFile({ path: "transcript.jsonl" } as never);
    const two = view.onLoadFile({ path: "agents.jsonl" } as never);
    expect(states.at(-1)).toBe(true);
    first();
    await one;
    expect(states.at(-1)).toBe(true);
    second();
    await two;
    expect(states.at(-1)).toBe(false);
    unsubscribe();
    await view.onunload();
  });
});
