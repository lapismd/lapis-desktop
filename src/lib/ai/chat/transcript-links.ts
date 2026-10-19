// SPDX-License-Identifier: Apache-2.0
import type { App } from "@lapis-notes/api";
import { isLapisInternalPath } from "@lapis-notes/api/path";
import { Decoration, WidgetType, type EditorView } from "@codemirror/view";
import { parseMiraFileTarget } from "@lapismd/mira/extensions";
import type { TranscriptBlock } from "@lapismd/design-core/chat";
import { transcriptNoteReferences } from "./transcript-note-references.ts";

class NoteLink extends WidgetType {
  constructor(
    readonly label: string,
    readonly path: string,
    readonly open: () => void,
  ) {
    super();
  }
  toDOM(view: EditorView) {
    const link = view.dom.ownerDocument.createElement("a");
    link.className = "ai-transcript-note-link";
    link.textContent = this.label;
    link.href = this.path;
    link.title = this.path;
    link.onclick = (event) => {
      event.preventDefault();
      this.open();
    };
    return link;
  }
}

/** Notes owns resolution/navigation; Design Core retains immutable readers/anchors. */
export function transcriptLinks(app?: App, sourcePath = "") {
  function resolveFileLink(_block: TranscriptBlock, destination: string) {
    if (!app || !destination) return;
    const { path } = parseMiraFileTarget(destination, sourcePath, {
      decodeUri: true,
    });
    if (
      !path ||
      /^(?:[a-z][a-z\d+.-]*:|[\\/])/iu.test(path) ||
      /[\r\n\0]/u.test(path)
    )
      return;
    const file = app.metadataCache.getFirstLinkpathDest(path, sourcePath);
    if (!file || isLapisInternalPath(file.path)) return;
    return () => {
      void app.openFile(file).catch((error) => {
        app.notifications.notify({
          id: "ai-note-navigation-error",
          source: "ai",
          severity: "error",
          title: "Open note",
          message: error instanceof Error ? error.message : String(error),
        });
      });
    };
  }
  return {
    resolveFileLink,
    inlineReferences(block: TranscriptBlock) {
      if (!app || block.kind !== "markdown") return [];
      return transcriptNoteReferences(block.text).flatMap((reference) => {
        const open = resolveFileLink(block, reference.path);
        return open
          ? [
              {
                from: reference.from,
                to: reference.to,
                decoration: Decoration.replace({
                  widget: new NoteLink(reference.label, reference.path, open),
                }).range(reference.from, reference.to),
              },
            ]
          : [];
      });
    },
  };
}
