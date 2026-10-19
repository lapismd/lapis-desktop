// SPDX-License-Identifier: Apache-2.0
import { TFile, TFolder, type Vault } from "@lapis-notes/api/vault";
import { parse, stringify } from "yaml";
import { conversationDirectory } from "./paths.ts";
import { validateConversationMetadata } from "./metadata-validation.ts";
import { assertSameImport } from "./session-imports.ts";
import type { ConversationLocation, ConversationMetadata } from "./types.ts";

/** Called inside the store's per-location queue. No read failure proves absence. */
export async function prepareVaultImport(
  vault: Vault,
  location: ConversationLocation,
  metadata: ConversationMetadata,
): Promise<void> {
  validateConversationMetadata(metadata);
  if (
    !metadata.imported ||
    metadata.imported.state !== "preparing" ||
    metadata.id !== location.conversationId
  )
    throw new Error(
      "Import initialization requires its exact preparing marker",
    );
  const directory = conversationDirectory(location);
  const existing = vault.getAbstractFileByPath(directory);
  if (existing && !(existing instanceof TFolder))
    throw new Error("Import destination is not a folder");
  if (!existing) await vault.mkpath(directory);
  const files = await vault.list(directory);
  if (
    files.folders.length ||
    files.files.some(
      (name) =>
        !["metadata.yaml", "agents.jsonl", "transcript.jsonl"].includes(name),
    )
  )
    throw new Error("Import destination contains unexpected content");
  const path = `${directory}/metadata.yaml`;
  const marker = vault.getAbstractFileByPath(path);
  if (marker) {
    if (!(marker instanceof TFile))
      throw new Error("Import marker is not a file");
    const text = await vault.read(marker);
    if (new TextEncoder().encode(text).length > 256 * 1024)
      throw new Error("Import marker exceeds its bound");
    const recorded = validateConversationMetadata(
      parse(text, { maxAliasCount: 10 }),
    );
    if (recorded.id !== location.conversationId)
      throw new Error("Import marker identity differs from its directory");
    assertSameImport(recorded, metadata);
    if (recorded.imported?.state === "complete") return;
  } else {
    if (files.files.length)
      throw new Error("Unmarked import content cannot be adopted");
    await vault.create(path, stringify(metadata, { lineWidth: 0 }));
  }
  for (const name of ["agents.jsonl", "transcript.jsonl"]) {
    const journal = vault.getAbstractFileByPath(`${directory}/${name}`);
    if (journal && !(journal instanceof TFile))
      throw new Error("Import journal is not a file");
    if (!journal) await vault.create(`${directory}/${name}`, "");
  }
}
