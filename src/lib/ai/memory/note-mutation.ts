// SPDX-License-Identifier: Apache-2.0
import {
  FileTextPersistence,
  type App,
  type FileEditingSession,
} from "@lapis-notes/api";
import type { TFile } from "@lapis-notes/api/vault";

/** An app-owned one-shot document writer using the public conflict machinery. */
export class MemoryNoteMutation implements FileEditingSession {
  dirty = true;
  private persistence?: FileTextPersistence;
  private draft = "";
  private path: string;
  readonly native = {
    hold: () => () => {},
    savedText: () => this.persistence?.baseline,
  };
  constructor(
    readonly app: App,
    readonly file: TFile,
    readonly transform: (text: string) => string,
  ) {
    this.path = file.path;
  }
  async flush(): Promise<void> {
    if (!this.dirty) return;
    if (this.file.path !== this.path)
      throw new Error("Memory note moved while writing");
    if (!this.persistence) {
      const baseline = await this.app.vault.read(this.file);
      try {
        this.draft = this.transform(baseline);
      } catch (error) {
        this.dirty = false;
        throw error;
      }
      if (this.draft === baseline) {
        this.dirty = false;
        return;
      }
      this.persistence = new FileTextPersistence({
        vault: this.app.vault,
        file: this.file,
        baseline,
        conflicts: this.app.fileEditingSessions.textConflicts,
        local: () => this.draft,
        serialize: (run) => this.app.fileEditingSessions.recover(this, run),
        protect: () => ({
          release() {},
          saved: () => {
            this.dirty = false;
          },
          reset: (text) => {
            this.draft = text;
          },
          resetSaved: (text) => {
            this.draft = text;
            this.dirty = false;
          },
        }),
      });
    }
    try {
      await this.persistence.persist(this.draft);
    } catch (error) {
      if (!this.persistence.hasConflict)
        await this.persistence.rejectPersistence(error);
      throw error;
    }
    this.dirty = false;
  }
  async protect() {
    return () => {};
  }
}
