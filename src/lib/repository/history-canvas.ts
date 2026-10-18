import { createColumnCanvasController } from "@lapismd/design-core/shadcn/column-canvas";

/** Adaptation of jj-store's log/diff/evolution geometry. */
export function createHistoryCanvas() {
  return createColumnCanvasController({
    columns: {
      revisions: {
        defaultWidth: 480,
        minWidth: 360,
        maxWidth: 720,
        collapsible: true,
        resizable: true,
      },
      diff: {
        defaultWidth: 560,
        minWidth: 360,
        maxWidth: 980,
        pathLevel: 1,
        closeable: true,
        closed: true,
        openOnSelect: false,
        resizable: true,
      },
      evolution: {
        defaultWidth: 480,
        minWidth: 360,
        maxWidth: 720,
        pathLevel: 1,
        closeable: true,
        closed: true,
        openOnSelect: false,
        resizable: true,
      },
      "evolution-diff": {
        defaultWidth: 560,
        minWidth: 360,
        maxWidth: 980,
        pathLevel: 1,
        closeable: true,
        closed: true,
        openOnSelect: false,
        resizable: true,
      },
    },
  });
}
