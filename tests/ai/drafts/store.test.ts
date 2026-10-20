// SPDX-License-Identifier: Apache-2.0
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  ConversationDraftStore,
  DRAFT_DIRECTORY,
} from "../../../src/lib/ai/drafts/store.ts";
import {
  emptyDraft,
  type ConversationDraft,
} from "../../../src/lib/ai/drafts/model.ts";
let Vault: typeof import("@lapis-notes/api/vault").Vault;
let MemoryVaultAdapter: typeof import("@lapis-notes/api/vault").MemoryVaultAdapter;
beforeAll(async () => {
  ({ Vault, MemoryVaultAdapter } = await import("@lapis-notes/api/vault"));
});
const key = JSON.stringify(["Notes", "123e4567-e89b-42d3-a456-426614174000"]);
const other = JSON.stringify([
  "Projects",
  "123e4567-e89b-42d3-a456-426614174000",
]);
const draft = (): ConversationDraft => ({
  text: "[Writer](lapis://agent:writer) Unsent notes",
  attachments: [{ path: "Notes/Guide.md", name: "Guide" }],
  threads: [
    {
      id: "thread",
      label: "Assistant response",
      anchor: { blockId: "m1", revision: "v1", from: 0, to: 5, quote: "Hello" },
      comments: [
        {
          id: "comment",
          author: { id: "local-user", name: "You" },
          text: "Please clarify",
          status: "draft",
        },
      ],
    },
  ],
});
async function harness() {
  const adapter = new MemoryVaultAdapter();
  const vault = new Vault(adapter);
  await vault.load();
  return { adapter, vault, store: new ConversationDraftStore(vault) };
}
describe("private conversation drafts", () => {
  it("retains an oversized draft in memory and refuses drain until corrected", async () => {
    const { store } = await harness();
    const value = { ...emptyDraft(), text: "x".repeat(2 * 1024 * 1024) };
    await expect(store.save(key, value)).rejects.toThrow("supported size");
    expect((await store.read(key)).text).toHaveLength(value.text.length);
    await expect(store.drain()).rejects.toThrow("drafts could not be saved");
    await store.save(key, { ...emptyDraft(), text: "Corrected" });
    await store.drain();
  });
  it("cold reloads scoped drafts, attachments and unsent comments without sharing a UUID across folders", async () => {
    const { adapter, store } = await harness();
    await store.save(key, draft());
    await store.save(other, { ...emptyDraft(), text: "A different scope" });
    await store.drain();
    const reopened = new Vault(adapter);
    await reopened.load();
    const next = new ConversationDraftStore(reopened);
    expect(await next.read(key)).toEqual(draft());
    expect((await next.read(other)).text).toBe("A different scope");
    const files = await reopened.list(DRAFT_DIRECTORY);
    expect(files.files).toHaveLength(2);
    expect(
      files.files.every((file) => /^[a-f0-9]{64}\.json$/u.test(file)),
    ).toBe(true);
  });
  it("keeps vaults independent and does not expose mutable cached values", async () => {
    const first = await harness(),
      second = await harness();
    await first.store.save(key, draft());
    const value = await first.store.read(key);
    value.text = "Mutated";
    value.attachments.length = 0;
    expect(await first.store.read(key)).toEqual(draft());
    expect(await second.store.read(key)).toEqual(emptyDraft());
  });
  it("serializes rapid saves and durably clears acknowledged text", async () => {
    const { vault, store } = await harness();
    await Promise.all([
      store.save(key, draft()),
      store.save(key, { ...draft(), text: "Newer edit" }),
    ]);
    await store.drain();
    expect((await new ConversationDraftStore(vault).read(key)).text).toBe(
      "Newer edit",
    );
    await store.save(key, emptyDraft());
    expect(await new ConversationDraftStore(vault).read(key)).toEqual(
      emptyDraft(),
    );
  });
  it("retains failed writes for explicit retry and refuses a successful drain", async () => {
    const { vault, store } = await harness();
    const write = vi
      .spyOn(vault, "create")
      .mockRejectedValueOnce(new Error("disk full"))
      .mockRejectedValueOnce(new Error("disk full"));
    await expect(store.save(key, draft())).rejects.toThrow("disk full");
    await expect(store.drain()).rejects.toThrow("drafts could not be saved");
    expect(await store.read(key)).toEqual(draft());
    await store.save(key, draft());
    await store.drain();
    expect(write).toHaveBeenCalledTimes(3);
  });
  it("rejects mismatched or malformed saved data without replacing its bytes", async () => {
    const { adapter, vault, store } = await harness();
    await store.save(key, draft());
    const path = `${DRAFT_DIRECTORY}/${(await vault.list(DRAFT_DIRECTORY)).files[0]}`;
    const raw = JSON.stringify({ version: 1, key: other, draft: draft() });
    await adapter.write(path, raw);
    await expect(new ConversationDraftStore(vault).read(key)).rejects.toThrow(
      "identity",
    );
    expect(await adapter.read(path)).toBe(raw);
    await adapter.write(path, '{"version":1');
    await expect(new ConversationDraftStore(vault).read(key)).rejects.toThrow();
  });
  it("does not restore a queued or uncertain comment as an unsent draft", async () => {
    const { adapter, vault, store } = await harness();
    await store.save(key, draft());
    const path = `${DRAFT_DIRECTORY}/${(await vault.list(DRAFT_DIRECTORY)).files[0]}`;
    const queued = draft();
    queued.threads[0]!.comments[0]!.status = "queued";
    await adapter.write(
      path,
      JSON.stringify({ version: 1, key, draft: queued }),
    );
    await expect(new ConversationDraftStore(vault).read(key)).rejects.toThrow(
      "Only unsent comments",
    );
  });
  it("fences a disk read that finishes after a newer save", async () => {
    const { adapter, vault, store } = await harness();
    await store.save(key, draft());
    const next = new ConversationDraftStore(vault);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const read = adapter.read.bind(adapter);
    vi.spyOn(adapter, "read").mockImplementationOnce(async (path) => {
      const old = await read(path);
      await gate;
      return old;
    });
    const pending = next.read(key);
    await vi.waitFor(() => expect(adapter.read).toHaveBeenCalled());
    await next.save(key, { ...draft(), text: "Typed while reading" });
    release();
    expect((await pending).text).toBe("Typed while reading");
  });
});
