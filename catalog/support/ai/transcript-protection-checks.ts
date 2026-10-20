import { expect } from "storybook/test";
import { FileEditingSessionRegistry } from "@lapis-notes/api";
import { ConversationRepository } from "../../../src/lib/ai/conversations/conversation-repository.ts";
import { Vault, MemoryVaultAdapter } from "@lapis-notes/api/vault";
import { VaultTranscriptStore } from "../../../src/lib/ai/conversations/vault-transcript-store.ts";
import { ConversationProtection } from "../../../src/lib/ai/conversations/transcript-protection.ts";
const location = {
  scopeDir: "Notes",
  conversationId: "123e4567-e89b-42d3-a456-426614174000",
};
const path = `Notes/.lapis/agents/sessions/${location.conversationId}/transcript.jsonl`;
async function fixture() {
  const registry = new FileEditingSessionRegistry();
  const vault = new Vault(new MemoryVaultAdapter());
  await vault.load();
  const store = new VaultTranscriptStore(vault);
  const repository = new ConversationRepository(store);
  const protection = new ConversationProtection(registry, repository, store);
  repository.protection = protection;
  await repository.create({
    id: location.conversationId,
    scopeDir: location.scopeDir,
  });
  return { registry, store, repository, protection };
}
export async function checkTranscriptProtection() {
  const it = async (_name: string, run: () => Promise<void>) => run();
  await it("fences new writes, drains admitted saves and reloads after application", async () => {
    const f = await fixture();
    let loaded = false;
    f.protection.attach(location, {
      protect: async () => () => {},
      reload: async () => {
        loaded = true;
      },
    });
    const saving = f.repository.writePinned(location, true);
    expect(
      f.repository.dirtyWrites(
        `${location.scopeDir}\u0000${location.conversationId}`,
      ),
    ).toBe(true);
    await f.protection.guard(path, async () => {
      expect((await f.store.read(location)).metadata.pinned).toBe(true);
      await expect(
        f.store.writeMetadata(
          location,
          (await f.store.read(location)).metadata,
        ),
      ).rejects.toThrow(/protected/);
      await expect(f.repository.writePinned(location, false)).rejects.toThrow(
        /protected/,
      );
    });
    await saving;
    await f.registry.afterMutations(async () => {});
    expect(loaded).toBe(true);
    await f.repository.writePinned(location, false);
  });
  await it("ordinary shutdown guards do not acquire replacement admission", async () => {
    const f = await fixture();
    f.protection.attach(location, {
      protect: async () => {
        throw new Error("active turn");
      },
      reload: async () => {},
    });
    await f.registry.guard(undefined, async () => {
      await f.repository.writePinned(location, true);
    });
    expect((await f.repository.read(location)).metadata.pinned).toBe(true);
  });
  await it("refuses active writers before applying replacement and releases its fence", async () => {
    const f = await fixture();
    let applied = false;
    const detach = f.protection.attach(location, {
      protect: async () => {
        throw new Error("active turn");
      },
      reload: async () => {},
    });
    try {
      await f.protection.guard(undefined, async () => {
        applied = true;
      });
      throw new Error("replacement unexpectedly admitted");
    } catch (error) {
      const failures = error instanceof AggregateError ? error.errors : [error];
      expect(failures).toHaveLength(3);
      for (const failure of failures)
        expect(failure.message).toMatch(/active turn/);
    }
    expect(applied).toBe(false);
    detach();
    await f.registry.afterMutations(async () => {});
    await f.repository.writePinned(location, true);
  });
  await it("refuses unsettled durable turns even without an open chat", async () => {
    const f = await fixture();
    const s = await f.store.read(location);
    await f.store.writeMetadata(location, {
      ...s.metadata,
      pendingTurn: {
        version: 1,
        id: "pending",
        userEntryId: "user",
        agentBindingId: "agent",
        startedAt: new Date().toISOString(),
      },
    });
    await expect(f.protection.guard(path, async () => {})).rejects.toThrow(
      /unsettled/,
    );
  });
  await it("guards creation of a new conversation during a whole-vault replacement", async () => {
    const f = await fixture();
    await f.protection.guard(undefined, async () => {
      await expect(
        f.repository.create({ scopeDir: "", id: crypto.randomUUID() }),
      ).rejects.toThrow(/protected/);
    });
  });
}
