import { mount, unmount } from "svelte";
import MemoryProof from "./ai-memory-owner.svelte";
import type { MemoryProofOwner } from "./ai-memory-owner.ts";
let owner: MemoryProofOwner | undefined;
let mounted: ReturnType<typeof mount> | undefined;
Object.assign(globalThis, {
  __lapisMemoryAcceptance: {
    async open(root: string) {
      await new Promise<void>((resolve, reject) => {
        mounted = mount(MemoryProof, {
          target: document.createElement("div"),
          props: {
            root,
            onReady: (value: MemoryProofOwner) => {
              owner = value;
              resolve();
            },
            onFailure: reject,
          },
        });
      });
    },
    async add() {
      if (!owner) throw new Error("No memory proof is open");
      const now = new Date().toISOString();
      await owner.store.write({
        schemaVersion: 1,
        id: "memory-native-proof",
        revision: 1,
        kind: "preference",
        scope: { kind: "workspace" },
        status: "active",
        importance: 4,
        triggers: ["headings"],
        summary: "Native memory uses compact headings.",
        evidence: [],
        createdBy: "owner-ui",
        createdAt: now,
        updatedAt: now,
      });
      return owner.store.list();
    },
    async inspect() {
      if (!owner) throw new Error("No memory proof is open");
      await owner.app.vault.reconcile();
      await owner.memory.rebuild();
      return {
        folder: owner.settings.get().memoryFolder,
        notes: await owner.store.list(),
        recalled: await owner.memory.recall("compact headings", {
          scopeDir: "",
        }),
      };
    },
    async move(folder: string) {
      if (!owner) throw new Error("No memory proof is open");
      try {
        await owner.settings.update({ memoryFolder: folder });
        return { ok: true };
      } catch (error) {
        return { ok: false, message: (error as Error).message };
      }
    },
    async close() {
      await owner?.close();
      if (mounted) await unmount(mounted);
      mounted = undefined;
      owner = undefined;
    },
  },
});
