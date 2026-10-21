// SPDX-License-Identifier: Apache-2.0
import type { App } from "@lapis-notes/api";
import { MemoryNoteMutation } from "./note-mutation.ts";
import { TFolder, type Vault } from "@lapis-notes/api/vault";

const queues = new WeakMap<Vault, Promise<unknown>>();
/** Web Locks coordinate windows; conditional writes also protect external edits. */
export function memoryLock<T>(vault: Vault, run: () => Promise<T>): Promise<T> {
  const next = (queues.get(vault) ?? Promise.resolve())
    .catch(() => {})
    .then(async () => {
      const locks = globalThis.navigator?.locks;
      return locks
        ? locks.request(
            `lapis-memory:${vault.getName()}`,
            async () => await run(),
          )
        : run();
    });
  queues.set(vault, next);
  return next;
}

export class MemoryNoteIO {
  constructor(
    readonly vault: Vault,
    readonly app?: App,
  ) {}
  async read(path: string): Promise<string | null> {
    if (this.vault.getAbstractFileByPath(path) instanceof TFolder)
      throw new Error(`${path} is a folder`);
    const file = this.vault.getFileByPath(path);
    return file
      ? this.vault.read(file)
      : (await this.vault.adapter.exists(path))
        ? this.vault.adapter.read(path)
        : null;
  }
  async update(
    path: string,
    transform: (current: string | null) => string,
  ): Promise<string> {
    await this.vault.mkpath(path.slice(0, path.lastIndexOf("/")));
    if (
      !this.vault.getFileByPath(path) &&
      (await this.vault.adapter.exists(path))
    )
      await this.vault.reconcile();
    const file = this.vault.getFileByPath(path);
    if (!file) {
      const content = transform(null);
      if (this.app) await this.app.fileManager.createFile(path, content);
      else await this.vault.create(path, content);
      return content;
    }
    let result = "";
    if (this.app) {
      await this.app.fileEditingSessions.mutate(
        path,
        () =>
          new MemoryNoteMutation(
            this.app!,
            file,
            (current) => (result = transform(current)),
          ),
      );
    } else {
      const current = await this.vault.read(file);
      result = transform(current);
      await this.vault.modifyIfUnchanged(file, result, current);
    }
    return result;
  }
}
