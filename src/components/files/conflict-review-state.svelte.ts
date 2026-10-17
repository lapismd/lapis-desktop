import type {
  FileTextConflict,
  FileTextConflictRegistry,
  FileTextResolution,
} from "@lapis-notes/api";

export class ConflictSelection {
  path = $state("");
}

/** Presentation state only; every recovery still uses the writer-owned decision. */
export class ConflictReviewState {
  entries = $state.raw<readonly FileTextConflict[]>([]);
  busy = $state<string | null>(null);
  error = $state("");

  constructor(
    readonly registry: FileTextConflictRegistry,
    readonly disabled: () => boolean,
  ) {}

  async recover(path: string, choice?: FileTextResolution): Promise<void> {
    if (this.disabled() || this.busy !== null) return;
    const conflict = this.entries.find((entry) => entry.path === path);
    if (!conflict) return;
    this.busy = path;
    this.error = "";
    try {
      if (choice === undefined) await conflict.refresh();
      else await conflict.resolve(choice);
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
    } finally {
      this.busy = null;
    }
  }
}
