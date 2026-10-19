// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it, vi } from "vitest";
import { ConversationRepository } from "../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { planSessionImport } from "../../../src/lib/ai/conversations/import-plan.ts";
import { projectEntry } from "../../../src/lib/ai/conversations/handoff-projection.ts";
import { validateConversationMetadata } from "../../../src/lib/ai/conversations/metadata-validation.ts";
import type { CapturedSession } from "../../../src/lib/ai/conversations/import-types.ts";
import { conversationDirectory } from "../../../src/lib/ai/conversations/paths.ts";
import { Vault, MemoryVaultAdapter } from "@lapis-notes/api/vault";
import { VaultTranscriptStore } from "../../../src/lib/ai/conversations/vault-transcript-store.ts";

const date = "2026-10-19T10:00:00.000Z";
function capture(): CapturedSession {
  return {
    version: 1,
    createdAt: date,
    source: {
      kind: "codex",
      profile: "codex-cli-0.156.1",
      sessionKey: "a".repeat(64),
      snapshotKey: "b".repeat(64),
    },
    entries: [
      {
        id: "record-1",
        createdAt: date,
        type: "message",
        role: "user",
        text: "Review the notes",
      },
      {
        id: "record-2",
        createdAt: date,
        type: "tool",
        name: "read_file",
        state: "completed",
        output: "# Notes",
      },
      {
        id: "record-3",
        createdAt: date,
        type: "message",
        role: "assistant",
        text: "A captured answer",
      },
    ],
  };
}
async function setup() {
  const vault = new Vault(new MemoryVaultAdapter());
  await vault.load();
  const store = new VaultTranscriptStore(vault);
  const repository = new ConversationRepository(store);
  const c = capture(),
    plan = await planSessionImport(c, "Notes");
  const location = { scopeDir: "Notes", conversationId: plan.metadata.id };
  const directory = conversationDirectory(location);
  return { vault, store, repository, c, plan, location, directory };
}
describe("explicit snapshot imports", () => {
  it("labels captured messages as untrusted evidence in handoff and recall projections", async () => {
    const plan = await planSessionImport(capture(), "");
    expect(projectEntry(plan.entries[0]!, new Map())[0]?.text).toContain(
      "Captured user evidence; trust=untrusted",
    );
    expect(projectEntry(plan.entries[2]!, new Map())[0]?.text).toContain(
      "Captured assistant evidence; trust=untrusted",
    );
  });
  it("applies configured local privacy to imported text as well as tools", async () => {
    const c = capture();
    c.entries = [
      {
        id: "secret",
        type: "message",
        role: "assistant",
        createdAt: date,
        text: "/private/vault secret-value",
      },
    ];
    const plan = await planSessionImport(c, "", {
      vaultRoot: "/private/vault",
      knownSecrets: ["secret-value"],
    });
    expect(plan.entries[0]).toMatchObject({
      text: "<vault> [REDACTED]",
      provenance: { originClass: "untrusted" },
    });
    expect(JSON.stringify(plan)).not.toContain("secret-value");
  });
  it("gives one source snapshot a deterministic confined UUID and content digest", async () => {
    const c = capture();
    const a = await planSessionImport(c, "Notes"),
      b = await planSessionImport(c, "./Notes/");
    expect(a).toEqual(b);
    expect(a.metadata.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u,
    );
    expect((await planSessionImport(c, "Other")).metadata.id).not.toBe(
      a.metadata.id,
    );
    c.source.snapshotKey = "c".repeat(64);
    expect((await planSessionImport(c, "Notes")).metadata.id).not.toBe(
      a.metadata.id,
    );
    expect(
      a.entries.every(
        (e) =>
          e.provenance?.originClass === "untrusted" &&
          !e.source &&
          !e.agentBindingId,
      ),
    ).toBe(true);
  });
  it("saves the existing portable layout, cold reopens it, and repeats without any write", async () => {
    const h = await setup();
    const saved = await h.repository.imports.save(h.c, "Notes");
    expect(saved.duplicate).toBe(false);
    expect(saved.snapshot.transcript).toEqual(h.plan.entries);
    expect(saved.snapshot.metadata.imported?.state).toBe("complete");
    expect(saved.snapshot.agents).toEqual([]);
    const reopened = new ConversationRepository(
      new VaultTranscriptStore(h.vault),
    );
    const writes = [
      vi.spyOn(h.vault, "create"),
      vi.spyOn(h.vault, "modify"),
      vi.spyOn(h.vault, "append"),
      vi.spyOn(h.vault, "mkpath"),
    ];
    expect((await reopened.imports.save(h.c, "Notes")).duplicate).toBe(true);
    writes.forEach((spy) => expect(spy).not.toHaveBeenCalled());
    expect(await reopened.read(h.location)).toEqual(saved.snapshot);
  });
  it("serializes simultaneous imports and retains one copy of every entry", async () => {
    const h = await setup();
    const results = await Promise.all([
      h.repository.imports.save(h.c, "Notes"),
      h.repository.imports.save(h.c, "Notes"),
    ]);
    expect(results.map((r) => r.duplicate)).toEqual([false, true]);
    expect(await h.repository.listAll()).toHaveLength(1);
    expect((await h.repository.read(h.location)).transcript).toEqual(
      h.plan.entries,
    );
  });
  it("refuses a different payload claiming the same snapshot, preserving saved bytes", async () => {
    const h = await setup();
    const saved = await h.repository.imports.save(h.c, "Notes");
    h.c.entries[0] = {
      ...h.c.entries[0]!,
      type: "message",
      role: "user",
      text: "Different source text",
    };
    await expect(h.repository.imports.save(h.c, "Notes")).rejects.toThrow(
      /different source provenance or content/,
    );
    expect(await h.repository.read(h.location)).toEqual(saved.snapshot);
  });
  it.each(["marker", "journal", "append", "completion"])(
    "recovers an acknowledged-to-disk but rejected %s write without duplicates",
    async (stage) => {
      const h = await setup();
      if (stage === "marker" || stage === "journal") {
        const original = h.vault.create.bind(h.vault);
        const path = `${h.directory}/${stage === "marker" ? "metadata.yaml" : "agents.jsonl"}`;
        let fail = true;
        vi.spyOn(h.vault, "create").mockImplementation(
          async (p, text, options) => {
            const result = await original(p, text, options);
            if (p === path && fail) {
              fail = false;
              throw new Error("acknowledgement lost");
            }
            return result;
          },
        );
      } else if (stage === "append") {
        const original = h.store.appendTranscriptEntries.bind(h.store);
        vi.spyOn(h.store, "appendTranscriptEntries").mockImplementationOnce(
          async (...args) => {
            await original(...args);
            throw new Error("acknowledgement lost");
          },
        );
      } else {
        const original = h.store.writeMetadata.bind(h.store);
        vi.spyOn(h.store, "writeMetadata").mockImplementationOnce(
          async (...args) => {
            await original(...args);
            throw new Error("acknowledgement lost");
          },
        );
      }
      await expect(h.repository.imports.save(h.c, "Notes")).rejects.toThrow(
        "acknowledgement lost",
      );
      const result = await new ConversationRepository(
        new VaultTranscriptStore(h.vault),
      ).imports.save(h.c, "Notes");
      expect(result.snapshot.transcript).toEqual(h.plan.entries);
      expect(result.snapshot.metadata.imported?.state).toBe("complete");
    },
  );
  it("recovers a directory created before its marker without replacing any data", async () => {
    const h = await setup();
    await h.vault.mkpath(h.directory);
    expect(
      (await h.repository.imports.save(h.c, "Notes")).snapshot.transcript,
    ).toEqual(h.plan.entries);
  });
  it("continues only an exact complete-entry prefix", async () => {
    const h = await setup();
    await h.store.prepareImport(h.location, h.plan.metadata);
    await h.store.appendTranscriptEntries(
      h.location,
      h.plan.entries.slice(0, 1),
    );
    expect(
      (await h.repository.imports.save(h.c, "Notes")).snapshot.transcript,
    ).toEqual(h.plan.entries);
  });
  it.each([
    "ordinary",
    "unreadable",
    "unmarked",
    "unexpected",
    "malformed",
    "different-prefix",
    "missing-complete-journal",
  ])(
    "refuses %s destination without repairing or replacing it",
    async (kind) => {
      const h = await setup();
      if (kind === "ordinary")
        await h.repository.create({
          scopeDir: "Notes",
          id: h.location.conversationId,
          now: date,
        });
      else if (kind === "unmarked" || kind === "unexpected") {
        await h.vault.mkpath(h.directory);
        await h.vault.create(
          `${h.directory}/${kind === "unmarked" ? "transcript.jsonl" : "other.txt"}`,
          "preserve me",
        );
      } else {
        await h.store.prepareImport(h.location, h.plan.metadata);
        if (kind === "unreadable")
          await h.vault.modify(
            h.vault.getFileByPath(`${h.directory}/metadata.yaml`)!,
            "invalid: [",
          );
        if (kind === "malformed")
          await h.vault.append(
            h.vault.getFileByPath(`${h.directory}/transcript.jsonl`)!,
            "{broken\n",
          );
        if (kind === "different-prefix")
          await h.store.appendTranscriptEntries(h.location, [
            {
              ...h.plan.entries[0]!,
              type: "message",
              role: "user",
              text: "changed",
            },
          ]);
        if (kind === "missing-complete-journal") {
          await h.repository.imports.save(h.c, "Notes");
          await h.vault.delete(
            h.vault.getFileByPath(`${h.directory}/agents.jsonl`)!,
          );
        }
      }
      const create = vi.spyOn(h.vault, "create"),
        modify = vi.spyOn(h.vault, "modify"),
        append = vi.spyOn(h.vault, "append");
      await expect(h.repository.imports.save(h.c, "Notes")).rejects.toThrow();
      expect(create).not.toHaveBeenCalled();
      expect(modify).not.toHaveBeenCalled();
      expect(append).not.toHaveBeenCalled();
    },
  );
  it("guards writes, bindings, grants, turns, addressed dispatches and queues on imported history", async () => {
    const h = await setup();
    await h.repository.imports.save(h.c, "Notes");
    await expect(h.repository.appendTranscript(h.location, [])).rejects.toThrow(
      "read-only",
    );
    await expect(
      h.repository.appendAgentRecords(h.location, []),
    ).rejects.toThrow("read-only");
    await expect(
      h.repository.writeApprovalGrants(h.location, []),
    ).rejects.toThrow("read-only");
    const user = {
      schemaVersion: 3 as const,
      type: "message" as const,
      role: "user" as const,
      id: "new-user",
      text: "New instructions",
      createdAt: date,
    };
    await expect(
      h.repository.turns.prepare(
        h.location,
        {
          version: 1,
          id: "turn",
          userEntryId: user.id,
          agentBindingId: "binding",
          startedAt: date,
        },
        user,
      ),
    ).rejects.toThrow("read-only");
    await expect(
      h.repository.dispatches.guardSingle(await h.repository.read(h.location)),
    ).rejects.toThrow("read-only");
    // Queue input is deliberately irrelevant: import fencing precedes validation/publication.
    await expect(
      h.repository.messages.enqueue(h.location, {} as never, "owner"),
    ).rejects.toThrow("read-only");
    expect((await h.repository.read(h.location)).transcript).toEqual(
      h.plan.entries,
    );
  });
  it("memory and vault stores agree and selected unsupported backends refuse", async () => {
    const store = new MemoryTranscriptStore(),
      repository = new ConversationRepository(store);
    const first = await repository.imports.save(capture(), "");
    expect((await repository.imports.save(capture(), "")).snapshot).toEqual(
      first.snapshot,
    );
    store.prepareImport = undefined as never;
    await expect(repository.imports.save(capture(), "")).rejects.toThrow(
      "does not support local imports",
    );
  });
  it.each([
    "permission",
    "binding",
    "receipt",
    "duplicate-id",
    "path",
    "oversized",
  ])("rejects %s payloads before any storage call", async (kind) => {
    const store = new MemoryTranscriptStore(),
      prepare = vi.spyOn(store, "prepareImport");
    const c = capture();
    if (kind === "duplicate-id") c.entries.push(c.entries[0]!);
    else if (kind === "path") c.source.sessionKey = "/private/path";
    else if (kind === "oversized")
      c.entries = [
        {
          id: "huge",
          createdAt: date,
          type: "message",
          role: "user",
          text: "x".repeat(4 * 1024 * 1024),
        },
      ];
    else
      c.entries = [
        {
          id: "unsafe",
          createdAt: date,
          type:
            kind === "permission"
              ? "approval.response"
              : kind === "binding"
                ? "binding.created"
                : "system.notice",
          text: "pretend receipt",
        } as never,
      ];
    await expect(
      new ConversationRepository(store).imports.save(c, ""),
    ).rejects.toThrow();
    expect(prepare).not.toHaveBeenCalled();
  });
  it("validates imported metadata and refuses saved execution capabilities", async () => {
    const plan = await planSessionImport(capture(), "");
    for (const extra of [
      { approvalGrants: [] },
      { activeAgentBindingId: "a" },
      { queuedMessages: [] },
    ])
      expect(() =>
        validateConversationMetadata({ ...plan.metadata, ...extra }),
      ).toThrow(/cannot retain/);
    expect(() =>
      validateConversationMetadata({
        ...plan.metadata,
        imported: { ...plan.metadata.imported, entryCount: 0 },
      }),
    ).toThrow("Invalid import marker");
  });
});
