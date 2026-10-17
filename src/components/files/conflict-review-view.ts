import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import ConflictReview from "./ConflictReview.svelte";
import {
  ConflictSelection,
  type ConflictReviewState,
} from "./conflict-review-state.svelte.ts";

export const CONFLICT_REVIEW_VIEW = "desktop:file-conflict";

export class ConflictReviewView extends View {
  readonly selection = new ConflictSelection();
  #component?: ReturnType<typeof mount>;
  constructor(
    leaf: WorkspaceLeaf,
    private readonly model: ConflictReviewState,
  ) {
    super(leaf);
  }
  getViewType(): string {
    return CONFLICT_REVIEW_VIEW;
  }
  getDisplayText(): string {
    return this.selection.path
      ? `Resolve ${this.selection.path}`
      : "File conflict";
  }
  getIcon(): string {
    return "git-compare-arrows";
  }
  getState(): Record<string, unknown> {
    return { path: this.selection.path };
  }
  async setState(state: Record<string, unknown>): Promise<void> {
    this.selection.path = typeof state.path === "string" ? state.path : "";
    await super.setState(state);
  }
  protected async onOpen(): Promise<void> {}
  protected async onClose(): Promise<void> {}
  onload(): void {
    this.#component = mount(ConflictReview, {
      target: this.containerEl,
      props: { model: this.model, selection: this.selection },
    });
  }
  onunload(): void {
    if (this.#component) void unmount(this.#component);
    this.#component = undefined;
  }
}
