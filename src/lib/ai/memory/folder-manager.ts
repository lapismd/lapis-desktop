// SPDX-License-Identifier: Apache-2.0
import type { App } from "@lapis-notes/api";
import type { AiPluginSettings } from "../settings/ai-settings.ts";
import type { AiSettingsStore } from "../settings/settings-store.ts";
import type { VaultMemoryRecordStore } from "./vault-memory-record-store.ts";
import { memoryFolder } from "./note-paths.ts";
import { memoryLock } from "./note-io.ts";

export class MemoryFolderManager {
  constructor(
    readonly app: App,
    readonly store: VaultMemoryRecordStore,
    readonly settings: AiSettingsStore,
  ) {}
  async recover(): Promise<void> {
    const move = (await this.store.ledger.state()).relocation;
    if (!move) return;
    await memoryLock(this.app.vault, async () => {
      const source = this.app.vault.getFolderByPath(move.from);
      const target = this.app.vault.getFolderByPath(move.to);
      if (source && target)
        throw new Error(
          "Memory move has conflicting source and destination folders",
        );
      if (source) await this.move(move.from, move.to);
      else if (!target)
        throw new Error("Memory move cannot locate either folder");
      await this.relocateReceipts(move.from, move.to);
      await this.settings.update({ memoryFolder: move.to });
      await this.store.ledger.update((state) => {
        state.folder = move.to;
        delete state.relocation;
      });
    });
  }
  transaction = async (
    current: AiPluginSettings,
    next: AiPluginSettings,
    save: () => Promise<void>,
  ): Promise<void> => {
    const from = memoryFolder(current.memoryFolder);
    const to = memoryFolder(next.memoryFolder);
    if (from === to) return save();
    if (to.startsWith(`${from}/`) || from.startsWith(`${to}/`))
      throw new Error(
        "Memory folder cannot move into itself or one of its parents",
      );
    await memoryLock(this.app.vault, async () => {
      if ((await this.store.ledger.state()).folder !== from)
        throw new Error(
          "Memory folder changed in another window; reload settings before moving it again",
        );
      if (await this.app.vault.adapter.exists(to))
        throw new Error("Memory destination already exists");
      const exists = await this.app.vault.adapter.exists(from);
      await this.store.ledger.update((state) => {
        state.relocation = { from, to };
      });
      let moved = false;
      try {
        if (exists) {
          await this.move(from, to);
          moved = true;
        }
        await this.relocateReceipts(from, to);
        await save();
      } catch (error) {
        try {
          if (
            moved ||
            ((await this.app.vault.adapter.exists(to)) &&
              !(await this.app.vault.adapter.exists(from)))
          )
            await this.move(to, from);
          await this.relocateReceipts(to, from);
          await this.store.ledger.update((state) => {
            delete state.relocation;
          });
        } catch (rollbackError) {
          throw new AggregateError(
            [error, rollbackError],
            "Memory move needs recovery before writing can continue",
          );
        }
        throw error;
      }
      await this.store.ledger.update((state) => {
        state.folder = to;
        delete state.relocation;
      });
    });
  };
  private async move(from: string, to: string): Promise<void> {
    const folder = this.app.vault.getFolderByPath(from);
    if (!folder) throw new Error("Memory source folder is unavailable");
    const parent = to.slice(0, to.lastIndexOf("/"));
    if (to.includes("/")) await this.app.vault.mkpath(parent);
    await this.app.fileManager.renameFile(folder, to);
  }
  private async relocateReceipts(from: string, to: string): Promise<void> {
    const relocate = (path: string) =>
      path.startsWith(`${from}/`) ? `${to}${path.slice(from.length)}` : path;
    for (const receipt of await this.store.ledger.receipts()) {
      receipt.curated = relocate(receipt.curated);
      receipt.daily = receipt.daily.map(relocate);
      receipt.currentDaily = relocate(receipt.currentDaily);
      receipt.baselines = Object.fromEntries(
        Object.entries(receipt.baselines).map(([path, text]) => [
          relocate(path),
          text,
        ]),
      );
      await this.store.ledger.save(receipt);
    }
  }
}
