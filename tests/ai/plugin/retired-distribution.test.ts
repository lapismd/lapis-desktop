import { expect, it, vi } from "vitest";
import {
  VerifiedPluginInstaller,
  type PluginCatalogDetail,
  type PluginCatalogEntry,
} from "@lapis-notes/api";
import { MemoryVaultAdapter } from "@lapis-notes/api/vault";

function legacyCatalog(repository: string) {
  const entry: PluginCatalogEntry = {
    id: "ai",
    name: "AI",
    author: "Catalog author",
    description: "Legacy cached catalog",
    channel: "official",
    status: "active",
    latestVersion: "0.1.16",
    minAppVersion: "0.0.1",
    platforms: ["desktop"],
    categories: [],
    detail: "https://catalog.example/plugins/ai.json",
  };
  const detail: PluginCatalogDetail = {
    schemaVersion: 1,
    id: entry.id,
    name: entry.name,
    description: entry.description,
    channel: entry.channel,
    status: "active",
    owner: { name: entry.author },
    latestVersion: entry.latestVersion,
    versions: {
      "0.1.16": {
        version: "0.1.16",
        minAppVersion: entry.minAppVersion,
        releasedAt: "2026-01-01T00:00:00.000Z",
        platforms: entry.platforms,
        bundle: {
          url: `https://github.com/${repository}/releases/download/ai%400.1.16/ai-0.1.16.lapis-plugin`,
          sha256: "0".repeat(64),
        },
      },
    },
  };
  return { entry, detail };
}

it.each([
  ["lapismd/lapis-plugins", 0],
  ["example/independent-ai", 1],
] as const)(
  "checks cached AI origin %s through the installed public API",
  async (repository, expectedRequests) => {
    const saved = {
      ".lapis/plugins/ai/data.json": '{"settings":{"model":"keep"}}',
      ".lapis/agents/sessions/saved/transcript.jsonl":
        '{"type":"message","text":"preserve conversation"}\n',
      ".lapis/memory/saved.md": "# Preserve memory\n",
    };
    const adapter = new MemoryVaultAdapter(saved);
    const write = vi.spyOn(adapter, "write");
    const fetch = vi.fn(
      async () => new Response(null, { status: 404, statusText: "Not Found" }),
    );
    const installer = new VerifiedPluginInstaller({
      adapter,
      trustedKeys: [],
      fetch,
    });

    await expect(
      installer.install(legacyCatalog(repository)),
    ).rejects.toMatchObject({
      code: "metadata-invalid",
    });
    expect(fetch).toHaveBeenCalledTimes(expectedRequests);
    expect(write).not.toHaveBeenCalled();
    for (const [path, contents] of Object.entries(saved))
      expect(await adapter.read(path)).toBe(contents);
  },
);
